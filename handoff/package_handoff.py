"""Create portable, verified Lorefy handoff snapshots without modifying the source."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import zipfile

HERE = Path(__file__).resolve().parent
WORKSPACE = HERE.parent.parent
SOURCE = WORKSPACE / "outputs" / "Lorefy-clean-app"
APP = HERE / "project" / "Lorefy-clean-app"
DENY_DIRS = {".git", "node_modules", ".playwright-cli", ".cache", "__pycache__", ".temp", ".superdesign", "xcuserdata", "DerivedData", "Pods"}
TEXT_EXTS = {".json", ".js", ".mjs", ".ts", ".md", ".txt", ".log", ".html", ".css", ".yml", ".yaml", ".toml", ".sql", ".swift", ".py", ".xml", ".pbxproj", ".sh", ".ass", ".env", ".xcconfig"}
SECRET_PATTERNS = {
    "private_key_block": re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\r\n\\nr ]+[A-Za-z0-9+/=]{32,}"),
    "github_token": re.compile(rb"(?:github_pat_[A-Za-z0-9_]{35,}|gh[pousr]_[A-Za-z0-9]{30,})"),
    "supabase_secret": re.compile(rb"(?:sb_secret_[A-Za-z0-9_-]{20,}|sbp_[A-Za-z0-9]{30,})"),
    "openai_secret": re.compile(rb"(?<![A-Za-z0-9/_-])sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{35,}"),
    "stripe_secret": re.compile(rb"sk_live_[A-Za-z0-9]{20,}"),
    "aws_access_key": re.compile(rb"AKIA[A-Z0-9]{16}"),
}
JWT = re.compile(rb"eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{25,}")


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def secret_rules(path):
    if path.suffix.lower() not in TEXT_EXTS and path.name not in {".npmrc", ".netrc"}:
        return []
    data = path.read_bytes()
    found = [name for name, pattern in SECRET_PATTERNS.items() if pattern.search(data)]
    for token in JWT.findall(data):
        try:
            part = token.split(b".")[1]
            payload = json.loads(base64.urlsafe_b64decode(part + b"=" * (-len(part) % 4)))
            if payload.get("role") in {"service_role", "authenticated"}:
                found.append("privileged_or_user_session_jwt")
        except (ValueError, UnicodeError):
            pass
    return sorted(set(found))


def excluded(path, base):
    relative = path.relative_to(base)
    if any(part in DENY_DIRS for part in relative.parts):
        return "cache/dependency/git/user-state"
    if relative.parts[0] == "artifacts":
        return "old-build-or-binary (build34 copied separately)"
    if path.name.startswith(".env") and not path.name.endswith(".example"):
        return "environment-file"
    if path.suffix.lower() in {".p8", ".p12", ".pfx", ".mobileprovision", ".pem", ".key"}:
        return "credential-or-signing-file"
    if path.name in {"credentials.json", ".npmrc", ".netrc", "auth.json", "storage-state.json", "storageState.json"}:
        return "credentials-or-session-file"
    if path.is_symlink():
        return "symlink (not portable)"
    return None


def portable_copy(base, target, exclusions):
    copied = []
    for directory, dirs, files in os.walk(base):
        parent = Path(directory)
        for name in list(dirs):
            reason = excluded(parent / name, base)
            if reason:
                exclusions.append({"path": str((parent / name).relative_to(base)), "reason": reason, "source": base.name})
                dirs.remove(name)
        for name in sorted(files):
            src = parent / name
            reason = excluded(src, base)
            if not reason:
                rules = secret_rules(src)
                reason = "secret-scan:" + ",".join(rules) if rules else None
            if reason:
                exclusions.append({"path": src.relative_to(base).as_posix(), "reason": reason, "source": base.name})
                continue
            dst = target / src.relative_to(base)
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            expected = digest(src)
            assert digest(dst) == expected, f"Copy mismatch: {src}"
            copied.append({"path": dst.relative_to(HERE).as_posix(), "bytes": dst.stat().st_size, "sha256": expected})
    return copied


def inspect_ipa():
    ipa = SOURCE / "artifacts" / "Lorefy-build34.ipa"
    target = HERE / "build34" / ipa.name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ipa, target)
    assert digest(ipa) == digest(target)
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None
        names = archive.namelist()
        plist_path = next(n for n in names if re.fullmatch(r"Payload/[^/]+\.app/Info.plist", n))
        metadata = plistlib.loads(archive.read(plist_path))
        prefix = plist_path.rsplit("/", 1)[0] + "/public/"
        public = [n for n in names if n.startswith(prefix) and not n.endswith("/")]
        runtime = archive.read(prefix + "config/lorefy-runtime.js").decode("utf-8")
        collections = json.loads(archive.read(prefix + "launch/decorations/pfpvibes/collections.json"))
        missing_overlays = [c["id"] for c in collections if prefix + c["overlay"] not in names]
        assert metadata["CFBundleVersion"] == "34"
        assert metadata["CFBundleIdentifier"] == "com.lorefy.app"
        assert len(collections) == 24 and not missing_overlays
        comparisons = {}
        for base_name in ["ios-web", "ios/App/App/public"]:
            base = SOURCE / base_name
            changed, missing, matched = [], [], 0
            for name in public:
                rel = name[len(prefix):]
                local = base / rel
                if not local.is_file():
                    missing.append(rel)
                elif digest(local) != hashlib.sha256(archive.read(name)).hexdigest():
                    changed.append(rel)
                else:
                    matched += 1
            extra = [p.relative_to(base).as_posix() for p in base.rglob("*") if p.is_file() and prefix + p.relative_to(base).as_posix() not in names]
            comparisons[base_name] = {"matched": matched, "different": changed, "missing": missing, "extra": extra}
        result = {
            "ipa": target.relative_to(HERE).as_posix(), "bytes": target.stat().st_size,
            "sha256": digest(target), "bundleId": metadata["CFBundleIdentifier"],
            "version": metadata["CFBundleShortVersionString"], "build": metadata["CFBundleVersion"],
            "publicFiles": len(public), "importedCollections": len(collections),
            "allImportedOverlaysPresent": not missing_overlays,
            "qaFilesInNativePublic": [n[len(prefix):] for n in public if n.startswith(prefix + "qa/")],
            "betaDecorationsEnabled": bool(re.search(r'"betaProfileDecorations"\s*:\s*true', runtime)),
            "nativeWebComparisons": comparisons,
            "scope": "Signed IPA verified locally; not a new Apple upload or physical-device crash test."
        }
        write_json(HERE / "verification" / "build34-ipa.json", result)
        print(json.dumps(result), flush=True)


def prepare():
    if APP.exists():
        raise SystemExit("Snapshot already exists; inspect before retrying. No overwrite performed.")
    omissions = []
    files = portable_copy(SOURCE, APP, omissions)
    for name in ["supabase", "docs"]:
        base = WORKSPACE / name
        if base.is_dir():
            files += portable_copy(base, HERE / "supplemental-workspace" / name, omissions)
    for name in ["lorefy-profile-promo", "lorefy-app-promo", "lorefy-app-promo-smooth-fhd", "lorefy-brand-kit"]:
        base = WORKSPACE / "outputs" / name
        if base.is_dir():
            files += portable_copy(base, HERE / "media" / name, omissions)
    cloud_path = HERE / "cloud-snapshot" / "live-inventory-and-functions.json"
    cloud = json.loads(cloud_path.read_text(encoding="utf-8"))
    for entry in cloud["deployedFunctions"]:
        for file in entry.get("files", []):
            name = Path(file["name"])
            if name.is_absolute() or ".." in name.parts:
                raise ValueError("Unsafe edge function path")
            dest = HERE / "cloud-snapshot" / "deployed-functions" / entry["slug"] / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(file["content"], encoding="utf-8")
            assert not secret_rules(dest)
    git = {}
    for name, args in {
        "head": ["rev-parse", "HEAD"], "remote": ["remote", "-v"],
        "history": ["log", "-12", "--format=%H %ad %s", "--date=iso-strict"],
        "status": ["status", "--porcelain=v1", "--untracked-files=all"]
    }.items():
        git[name] = subprocess.run(["git", "-C", str(SOURCE), *args], capture_output=True, text=True, encoding="utf-8", errors="replace", check=True).stdout
    write_json(HERE / "verification" / "source-git-state.json", git)
    write_json(HERE / "verification" / "copied-file-manifest.json", files)
    write_json(HERE / "verification" / "excluded-files.json", omissions)
    inspect_ipa()
    print(json.dumps({"copiedFiles": len(files), "copiedBytes": sum(f["bytes"] for f in files), "excludedEntries": len(omissions)}), flush=True)


def run_tests():
    node = shutil.which("node")
    if not node:
        raise SystemExit("Install Node.js, then rerun tests.")
    tests = sorted(str(p) for p in (APP / "tests").glob("*.test.js"))
    result = subprocess.run([node, "--test", "--test-reporter=tap", "--test-concurrency=1", *tests], cwd=APP, capture_output=True, text=True, encoding="utf-8", errors="replace")
    log = HERE / "verification" / "handoff-tests.txt"
    log.write_text(result.stdout + "\n" + result.stderr, encoding="utf-8")
    summary = [line for line in result.stdout.splitlines() if re.match(r"# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms)", line)]
    write_json(HERE / "verification" / "test-result.json", {"exitCode": result.returncode, "command": "node --test --test-reporter=tap --test-concurrency=1 tests/*.test.js", "nodeVersion": subprocess.check_output([node, "--version"], text=True).strip(), "summary": summary})
    print("\n".join(summary), flush=True)
    if result.returncode:
        print("\n".join(result.stdout.splitlines()[-60:]), flush=True)
    return result.returncode


def restore_reviewed_catalog_files():
    # The initial scanner matched sk- inside ordinary book-title URL slugs.
    reviewed = ["output/catalog-bulk/ranobedb-tables-20261008.json", "output/catalog-bulk/mangadex/Manga-6100.json"]
    manifests = json.loads((HERE / "verification" / "copied-file-manifest.json").read_text(encoding="utf-8"))
    omissions = json.loads((HERE / "verification" / "excluded-files.json").read_text(encoding="utf-8"))
    for relative in reviewed:
        src, dst = SOURCE / relative, APP / relative
        assert not secret_rules(src), f"Unexpected credential match: {relative}"
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        expected = digest(src)
        assert digest(dst) == expected
        path = dst.relative_to(HERE).as_posix()
        if not any(record["path"] == path for record in manifests):
            manifests.append({"path": path, "bytes": dst.stat().st_size, "sha256": expected})
    omissions = [r for r in omissions if r["path"] not in reviewed]
    write_json(HERE / "verification" / "copied-file-manifest.json", manifests)
    write_json(HERE / "verification" / "excluded-files.json", omissions)
    write_json(HERE / "verification" / "secret-scan-review.json", {"reviewedFalsePositives": reviewed, "reason": "sk- occurred within normal catalog book-title URL slugs, not credential literals; boundary-aware scan passed; original files copied unchanged", "scope": "Explicit exclusions and credential-pattern scan; not a guarantee against every possible secret representation."})
    print(json.dumps({"restoredCatalogFiles": len(reviewed), "manifestFiles": len(manifests)}), flush=True)


def pack():
    copied = json.loads((HERE / "verification" / "copied-file-manifest.json").read_text(encoding="utf-8"))
    for record in copied:
        assert digest(HERE / record["path"]) == record["sha256"], f"Snapshot changed: {record['path']}"
    manifests = []
    selections = {
        "Lorefy-build34-project": ["project", "build34", "cloud-snapshot", "supplemental-workspace", "verification", "handoff-docs", "START_HERE_AR.md", "PROMPT_FOR_NEW_ACCOUNT.md", "AGENTS.md", "package_handoff.py"],
        "Lorefy-media-and-brand-sources": ["media", "handoff-docs/MEDIA.md"],
        "Lorefy-next-agent-context": ["handoff-docs", "START_HERE_AR.md", "PROMPT_FOR_NEW_ACCOUNT.md", "AGENTS.md", "verification/build34-ipa.json", "verification/test-result.json", "verification/npm-audit.json"]
    }
    for archive_name, roots in selections.items():
        items = set()
        for root in roots:
            path = HERE / root
            if path.is_file():
                items.add(path)
            elif path.is_dir():
                for parent, dirs, files in os.walk(path):
                    dirs[:] = [d for d in dirs if d not in DENY_DIRS]
                    for name in files:
                        candidate = Path(parent) / name
                        if candidate.suffix.lower() in {".p8", ".p12", ".pem", ".key", ".mobileprovision"} or (candidate.name.startswith(".env") and not candidate.name.endswith(".example")):
                            continue
                        items.add(candidate)
        entries = [{"path": p.relative_to(HERE).as_posix(), "bytes": p.stat().st_size, "sha256": digest(p)} for p in sorted(items)]
        archive_path = HERE / f"{archive_name}.zip"
        with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as archive:
            for entry in entries:
                archive.write(HERE / entry["path"], entry["path"])
            archive.writestr("ARCHIVE_MANIFEST.json", json.dumps(entries, indent=2))
        with zipfile.ZipFile(archive_path) as archive:
            assert archive.testzip() is None
            for entry in entries:
                assert hashlib.sha256(archive.read(entry["path"])).hexdigest() == entry["sha256"], f"Archive mismatch: {entry['path']}"
        record = {"name": archive_path.name, "bytes": archive_path.stat().st_size, "sha256": digest(archive_path), "files": len(entries), "crcAndEveryEntrySha256Verified": True}
        manifests.append(record)
        print(json.dumps(record), flush=True)
    write_json(HERE / "DELIVERY_MANIFEST.json", manifests)
    (HERE / "SHA256SUMS.txt").write_text("".join(f"{r['sha256']}  {r['name']}\n" for r in manifests), encoding="ascii")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["prepare", "test", "pack", "restore-reviewed"])
    args = parser.parse_args()
    if args.action == "prepare":
        prepare()
    elif args.action == "test":
        raise SystemExit(run_tests())
    elif args.action == "restore-reviewed":
        restore_reviewed_catalog_files()
    else:
        pack()
