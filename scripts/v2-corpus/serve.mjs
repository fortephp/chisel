#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, "../..");

const MIME_TYPES = {
  ".blade.php": "text/plain; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".php": "text/plain; charset=utf-8",
};

function parseArguments(argv) {
  const options = {
    directory: join(REPOSITORY_ROOT, ".tmp", "v2-corpus-review"),
    host: "127.0.0.1",
    port: 4173,
  };

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value) throw new Error(`${flag} requires a value`);
    if (flag === "--dir") options.directory = resolve(REPOSITORY_ROOT, value);
    else if (flag === "--host") options.host = value;
    else if (flag === "--port") options.port = Number.parseInt(value, 10);
    else throw new Error(`Unknown option: ${flag}`);
  }

  if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65535) {
    throw new Error("--port must be between 1 and 65535");
  }
  return options;
}

function resolvedRequestPath(root, requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = resolve(root, requested);
  const relativePath = relative(root, filePath);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) return null;
  return filePath;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  await stat(join(options.directory, "index.html"));

  const server = createServer(async (request, response) => {
    try {
      const filePath = resolvedRequestPath(options.directory, request.url ?? "/");
      if (!filePath) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      const fileStats = await stat(filePath);
      if (!fileStats.isFile()) throw new Error("Not a file");
      const extension = filePath.endsWith(".blade.php") ? ".blade.php" : extname(filePath);
      response.writeHead(200, {
        "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });

  server.listen(options.port, options.host, () => {
    console.log(`v2/v3 corpus review: http://${options.host}:${options.port}`);
    console.log("Press Ctrl+C to stop.");
  });
}

main().catch((error) => {
  console.error(
    error?.code === "ENOENT"
      ? "No generated report found. Run `node scripts/v2-corpus/generate.mjs` first."
      : error instanceof Error
        ? error.message
        : error,
  );
  process.exitCode = 1;
});
