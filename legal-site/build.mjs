import { cp, mkdir, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/assets", { recursive: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await cp("public", "dist/assets", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await writeFile("dist/server/index.js", `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;
    if (path.endsWith("/")) path += "index.html";
    const assetUrl = new URL(path, request.url);
    const response = await env.ASSETS.fetch(new Request(assetUrl, request));
    const headers = new Headers(response.headers);
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "strict-origin-when-cross-origin");
    headers.set("content-security-policy", "default-src 'self'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    return new Response(response.body, { status: response.status, headers });
  }
};\n`, "utf8");
