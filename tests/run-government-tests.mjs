import { build } from "esbuild";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
const root = resolve(import.meta.dirname, "..");
const cache = join(root, "node_modules", ".cache");
await mkdir(cache, { recursive: true });
const temporary = await mkdtemp(join(cache, "government-tests-"));
try {
  await build({
    entryPoints: [join(root, "tests/government.test.tsx")],
    outdir: temporary,
    entryNames: "tests",
    outExtension: { ".js": ".mjs" },
    splitting: true,
    bundle: true,
    packages: "external",
    platform: "node",
    format: "esm",
    jsx: "automatic",
    alias: { "@": join(root, "src") },
    define: {
      "import.meta.env": JSON.stringify({
        VITE_API_URL: "http://localhost:3000",
      }),
    },
    logLevel: "silent",
  });
  await import(pathToFileURL(join(temporary, "tests.mjs")).href);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
