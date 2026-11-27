import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const packages = Object.entries(lock.packages ?? {})
  .filter(([path]) => path.startsWith("node_modules/"))
  .map(([path, metadata]) => ({
    name: path.slice("node_modules/".length),
    version: metadata.version ?? "unknown",
    license:
      typeof metadata.license === "string"
        ? metadata.license
        : metadata.license?.type ?? "UNSPECIFIED",
  }));

const counts = new Map();
for (const item of packages) {
  counts.set(item.license, (counts.get(item.license) ?? 0) + 1);
}

console.log("# LifeMode dependency license inventory");
console.log("");
console.log(`Lockfile version: ${lock.lockfileVersion ?? "unknown"}`);
console.log(`Package entries: ${packages.length}`);
console.log("");
console.log("| License expression | Entries |");
console.log("|---|---:|");
for (const [license, count] of [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`| ${license} | ${count} |`);
}
console.log("");
console.log("## Package entries");
console.log("");
console.log("| Package | Version | License expression |");
console.log("|---|---|---|");
for (const item of packages.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(`| ${item.name} | ${item.version} | ${item.license} |`);
}
console.log("");
console.log("Metadata inventory only. Verify package LICENSE/COPYING/NOTICE files and distribution obligations separately.");
