#!/usr/bin/env node
import { rmSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
const dirs = [".next", join("node_modules", ".cache")];

for (const dir of dirs) {
  const full = join(root, dir);
  if (existsSync(full)) {
    try {
      rmSync(full, { recursive: true, force: true });
      console.log("Removed:", dir);
    } catch (e) {
      console.warn("Could not remove", dir, e.message);
    }
  }
}
