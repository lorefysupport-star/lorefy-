#!/usr/bin/env node

import { createHash, createPrivateKey, sign } from "node:crypto";
import { open, readFile, stat } from "node:fs/promises";
import { basename, resolve } from "node:path";

const API_ROOT = "https://api.appstoreconnect.apple.com/v1";

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      values[key] = true;
      continue;
    }
    values[key] = next;
    index += 1;
  }
  return values;
}

function requireValue(value, label) {
  if (!value) throw new Error(`Missing ${label}`);
  return String(value);
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function createIndividualToken({ keyId, privateKey }) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    sub: "user",
    iat: now - 5,
    exp: now + 10 * 60,
    aud: "appstoreconnect-v1"
  }));
  const signingInput = `${header}.${payload}`;
  const signature = sign("sha256", Buffer.from(signingInput), {
    key: privateKey,
    dsaEncoding: "ieee-p1363"
  }).toString("base64url");
  return `${signingInput}.${signature}`;
}

function errorDetails(body) {
  if (!body) return "No response body";
  if (Array.isArray(body.errors)) {
    return body.errors
      .map((error) => [error.status, error.code, error.title, error.detail].filter(Boolean).join(" | "))
      .join("\n");
  }
  return JSON.stringify(body);
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function createApiClient(credentials) {
  return async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${createIndividualToken(credentials)}`);
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      headers,
      body: options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body
    });
    const body = await parseResponse(response);
    if (!response.ok) {
      throw new Error(`${options.method || "GET"} ${path} failed (${response.status})\n${errorDetails(body)}`);
    }
    return body;
  };
}

async function md5File(filePath) {
  const handle = await open(filePath, "r");
  const hash = createHash("md5");
  const buffer = Buffer.allocUnsafe(4 * 1024 * 1024);
  try {
    while (true) {
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
      if (!bytesRead) break;
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    await handle.close();
  }
  return hash.digest("hex");
}

async function uploadPart(handle, operation, index, total) {
  const length = Number(operation.length);
  const offset = Number(operation.offset);
  const data = Buffer.allocUnsafe(length);
  const { bytesRead } = await handle.read(data, 0, length, offset);
  if (bytesRead !== length) {
    throw new Error(`Could not read upload part ${index + 1}: expected ${length}, got ${bytesRead}`);
  }

  const headers = new Headers();
  for (const header of operation.requestHeaders || []) {
    headers.set(header.name, header.value);
  }
  if (!headers.has("Content-Length")) headers.set("Content-Length", String(length));

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(operation.url, {
        method: operation.method || "PUT",
        headers,
        body: data
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 400)}`);
      }
      console.log(`Uploaded part ${index + 1}/${total} (${length} bytes)`);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 1500));
    }
  }
  throw lastError;
}

async function pollBuildUpload(request, uploadId, timeoutMs = 45 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs;
  let previousState = "";
  while (Date.now() < deadline) {
    const result = await request(`/buildUploads/${uploadId}?include=build`);
    const state = result?.data?.attributes?.state;
    const stateName = state?.state || "UNKNOWN";
    if (stateName !== previousState) {
      console.log(`Apple processing state: ${stateName}`);
      previousState = stateName;
    }
    if (stateName === "COMPLETE") {
      const build = (result.included || []).find((item) => item.type === "builds");
      return { upload: result.data, build };
    }
    if (stateName === "FAILED") {
      throw new Error(`Apple build processing failed\n${JSON.stringify(state, null, 2)}`);
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 15000));
  }
  throw new Error("Timed out waiting for Apple to process the build upload");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const keyId = requireValue(args["key-id"] || process.env.ASC_KEY_ID, "--key-id or ASC_KEY_ID");
  const keyPath = resolve(requireValue(args.key || process.env.ASC_PRIVATE_KEY_PATH, "--key or ASC_PRIVATE_KEY_PATH"));
  const appId = requireValue(args["app-id"] || process.env.ASC_APP_ID, "--app-id or ASC_APP_ID");
  const version = requireValue(args.version || process.env.ASC_VERSION, "--version or ASC_VERSION");
  const buildNumber = requireValue(args.build || process.env.ASC_BUILD_NUMBER, "--build or ASC_BUILD_NUMBER");
  const privateKey = createPrivateKey(await readFile(keyPath, "utf8"));
  const request = createApiClient({ keyId, privateKey });

  const app = await request(`/apps/${encodeURIComponent(appId)}?fields[apps]=name,bundleId`);
  console.log(`Authenticated for ${app.data.attributes.name} (${app.data.attributes.bundleId})`);
  if (args["verify-only"]) return;

  const ipaPath = resolve(requireValue(args.ipa || process.env.ASC_IPA_PATH, "--ipa or ASC_IPA_PATH"));
  const ipaStat = await stat(ipaPath);
  if (!ipaStat.isFile() || ipaStat.size < 1) throw new Error("IPA path is not a non-empty file");

  const upload = await request("/buildUploads", {
    method: "POST",
    body: {
      data: {
        type: "buildUploads",
        attributes: {
          cfBundleShortVersionString: version,
          cfBundleVersion: buildNumber,
          platform: "IOS"
        },
        relationships: {
          app: { data: { type: "apps", id: appId } }
        }
      }
    }
  });
  const uploadId = upload.data.id;
  console.log(`Reserved Apple build upload ${uploadId}`);

  const reservation = await request("/buildUploadFiles", {
    method: "POST",
    body: {
      data: {
        type: "buildUploadFiles",
        attributes: {
          assetType: "ASSET",
          fileName: basename(ipaPath),
          fileSize: ipaStat.size,
          uti: "com.apple.ipa"
        },
        relationships: {
          buildUpload: { data: { type: "buildUploads", id: uploadId } }
        }
      }
    }
  });
  const fileId = reservation.data.id;
  const operations = reservation.data.attributes.uploadOperations || [];
  if (!operations.length) throw new Error("Apple returned no upload operations");
  console.log(`Uploading ${ipaStat.size} bytes in ${operations.length} part(s)`);

  const handle = await open(ipaPath, "r");
  try {
    const concurrency = 3;
    for (let index = 0; index < operations.length; index += concurrency) {
      const batch = operations.slice(index, index + concurrency);
      await Promise.all(batch.map((operation, batchIndex) =>
        uploadPart(handle, operation, index + batchIndex, operations.length)));
    }
  } finally {
    await handle.close();
  }

  const checksum = await md5File(ipaPath);
  await request(`/buildUploadFiles/${fileId}`, {
    method: "PATCH",
    body: {
      data: {
        type: "buildUploadFiles",
        id: fileId,
        attributes: {
          uploaded: true,
          sourceFileChecksums: {
            file: { hash: checksum, algorithm: "MD5" }
          }
        }
      }
    }
  });
  console.log("IPA committed. Waiting for Apple processing...");

  const completed = await pollBuildUpload(request, uploadId);
  console.log(JSON.stringify({
    status: "complete",
    buildUploadId: uploadId,
    buildId: completed.build?.id || null,
    buildNumber: completed.build?.attributes?.version || buildNumber,
    uploadedDate: completed.build?.attributes?.uploadedDate || completed.upload?.attributes?.uploadedDate || null
  }, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
