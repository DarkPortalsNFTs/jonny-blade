const fs = require("fs/promises");
const path = require("path");

const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const copyTargets = [
  "ai",
  "middleware",
  "public",
  "routes",
  "views",
  "server.cjs",
  "package.json",
  "package-lock.json",
  "README.md",
  "capacitor.config.json",
  "render.yaml",
];

const shouldCopy = (src) => {
  if (src.endsWith(".db")) return false;
  return true;
};

const copyItem = async (target) => {
  const src = path.join(root, target);
  const dest = path.join(distDir, target);
  try {
    const stat = await fs.stat(src);
    if (stat.isDirectory()) {
      await fs.cp(src, dest, { recursive: true, filter: shouldCopy });
      return;
    }
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }
};

const run = async () => {
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });
  await Promise.all(copyTargets.map(copyItem));
  process.stdout.write("Build complete: dist/\n");
};

run().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
