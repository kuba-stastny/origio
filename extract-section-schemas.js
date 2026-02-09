/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const vm = require("vm");

const ROOT = process.cwd();

// default: src/sections
const SECTIONS_DIR = process.argv[2]
  ? path.resolve(ROOT, process.argv[2])
  : path.resolve(ROOT, "src", "sections");

// default: sections-schemas.json
const OUT_FILE = process.argv[3]
  ? path.resolve(ROOT, process.argv[3])
  : path.resolve(ROOT, "sections-schemas.json");

// volitelný flag: --exports-only
const EXPORTS_ONLY = process.argv.includes("--exports-only");

const VALID_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

// ✅ match pro tvoje "ABOUT_ME_SCHEMA"
function isSchemaConstName(name) {
  // 1) nejčastější: končí na _SCHEMA
  if (/_SCHEMA$/i.test(name)) return true;

  // 2) fallback: obsahuje "SCHEMA"
  if (/SCHEMA/i.test(name)) return true;

  return false;
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else {
      const ext = path.extname(e.name).toLowerCase();
      if (VALID_EXT.has(ext)) out.push(full);
    }
  }
  return out;
}

function safeRead(file) {
  return fs.readFileSync(file, "utf8");
}

function getFolderName(file) {
  const rel = path.relative(SECTIONS_DIR, file);
  const parts = rel.split(path.sep);
  return parts[0] || "";
}

function evalInitializerTS(initializerText) {
  // initializer může mít "as const" → TypeScript to přeloží
  const wrappedTs = `
    const __VALUE__ = (${initializerText});
    module.exports = __VALUE__;
  `;

  const transpiled = ts.transpileModule(wrappedTs, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
      removeComments: true,
    },
    reportDiagnostics: false,
  }).outputText;

  // sandbox bez require/fs
  const sandbox = {
    module: { exports: null },
    exports: {},
  };

  vm.createContext(sandbox);
  const script = new vm.Script(transpiled, { timeout: 300 });
  script.runInContext(sandbox);

  return sandbox.module.exports;
}

function extractSchemasFromFile(file) {
  const code = safeRead(file);
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const results = [];

  function isExported(node) {
    // export const ...
    const mods = node.modifiers;
    if (!mods) return false;
    return mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  }

  function visit(node) {
    if (ts.isVariableStatement(node)) {
      const isConst =
        (node.declarationList.flags & ts.NodeFlags.Const) === ts.NodeFlags.Const;

      if (!isConst) return ts.forEachChild(node, visit);

      if (EXPORTS_ONLY && !isExported(node)) {
        return ts.forEachChild(node, visit);
      }

      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;

        const name = decl.name.text;
        if (!isSchemaConstName(name)) continue;

        const init = decl.initializer;
        if (!init) {
          results.push({ name, ok: false, error: "Missing initializer" });
          continue;
        }

        const initText = init.getText(sf);

        try {
          const value = evalInitializerTS(initText);

          // musí být JSON-serializable
          JSON.stringify(value);

          results.push({ name, ok: true, value });
        } catch (err) {
          results.push({
            name,
            ok: false,
            error: String(err?.message || err),
            initializerPreview: initText.slice(0, 260),
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sf);
  return results;
}

function main() {
  if (!isDir(SECTIONS_DIR)) {
    console.error("❌ Sections directory not found:", SECTIONS_DIR);
    process.exit(1);
  }

  const files = walk(SECTIONS_DIR);

  const out = {
    generatedAt: new Date().toISOString(),
    sectionsDir: SECTIONS_DIR,
    exportsOnly: EXPORTS_ONLY,
    totalFilesScanned: files.length,
    items: [],
  };

  for (const f of files) {
    const folder = getFolderName(f);
    const extracted = extractSchemasFromFile(f);

    for (const item of extracted) {
      out.items.push({
        name: item.name,
        folder,
        file: path.relative(ROOT, f).replaceAll("\\", "/"),
        ok: item.ok,
        schema: item.ok ? item.value : undefined,
        error: item.ok ? undefined : item.error,
        initializerPreview: item.ok ? undefined : item.initializerPreview,
      });
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), "utf8");

  const okCount = out.items.filter((x) => x.ok).length;
  const failCount = out.items.filter((x) => !x.ok).length;

  console.log("✅ Done");
  console.log("   scanned files:", out.totalFilesScanned);
  console.log("   schemas ok:", okCount);
  console.log("   schemas failed:", failCount);
  console.log("   output:", OUT_FILE);
}

main();
