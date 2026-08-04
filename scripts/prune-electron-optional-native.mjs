import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const optionalNativePackages = ["canvas", "path2d"];

for (const packageName of optionalNativePackages) {
  const packagePath = path.resolve(repoRoot, "node_modules", packageName);
  const nodeModulesRoot = path.resolve(repoRoot, "node_modules") + path.sep;

  if (!packagePath.startsWith(nodeModulesRoot)) {
    throw new Error(`Refusing to prune outside node_modules: ${packagePath}`);
  }

  if (!fs.existsSync(packagePath)) {
    continue;
  }

  fs.rmSync(packagePath, { recursive: true, force: true });
  console.log(`Pruned optional native package for Electron build: ${packageName}`);
}
