import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageFile = path.join(root, "ios", "App", "CapApp-SPM", "Package.swift");

if (!fs.existsSync(packageFile)) process.exit(0);

const source = fs.readFileSync(packageFile, "utf8");
const normalized = source.replace(/(path:\s*")([^"]+)(")/g, (_, prefix, value, suffix) => {
  return prefix + value.replaceAll("\\", "/") + suffix;
});

if (normalized !== source) fs.writeFileSync(packageFile, normalized, "utf8");
