#!/usr/bin/env node
/**
 * Reemplaza la URL base en HTML, sitemap.xml, robots.txt y JSON-LD.
 * Uso: node scripts/set-base-url.mjs https://hallobot.no
 * No es un build: solo para uso manual al cambiar de dominio.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const newUrl = (process.argv[2] || "").replace(/\/$/, "");
if (!newUrl || !/^https?:\/\//.test(newUrl)) {
  console.error("Uso: node scripts/set-base-url.mjs <url>");
  console.error("Ejemplo: node scripts/set-base-url.mjs https://hallobot.no");
  process.exit(1);
}

const configPath = join(root, "site.config.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
const oldUrl = (config.BASE_URL || "").replace(/\/$/, "");
if (!oldUrl) {
  console.error("BASE_URL no encontrada en site.config.json");
  process.exit(1);
}

if (oldUrl === newUrl) {
  console.log("La URL base ya es", newUrl);
  process.exit(0);
}

const extensions = new Set([".html", ".xml", ".txt", ".json"]);
const skipDirs = new Set([".git", "node_modules", "scripts"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else {
      const ext = name.includes(".") ? "." + name.split(".").pop() : "";
      if (extensions.has(ext) || name === "robots.txt" || name === "sitemap.xml") {
        out.push(p);
      }
    }
  }
  return out;
}

const files = walk(root);
let changed = 0;
for (const file of files) {
  const before = readFileSync(file, "utf8");
  if (!before.includes(oldUrl)) continue;
  const after = before.split(oldUrl).join(newUrl);
  writeFileSync(file, after);
  changed++;
  console.log("Actualizado:", file.replace(root + "/", ""));
}

config.BASE_URL = newUrl;
writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
console.log("site.config.json →", newUrl);
console.log(`Listo: ${changed} archivo(s) actualizados.`);
