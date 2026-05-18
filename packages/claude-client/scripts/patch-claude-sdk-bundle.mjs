import fs from "node:fs";

const bundlePath = new URL("../dist/claude-sdk-bundle.js", import.meta.url);
let source = fs.readFileSync(bundlePath, "utf8");

source = source.replace(
  'import { createRequire as $S } from "node:module";',
  [
    'import { createRequire as $S } from "node:module";',
    'import * as __angelFs from "node:fs";',
    'import { pathToFileURL as __angelPathToFileURL } from "node:url";',
    'const __angelModuleUrl = typeof __filename === "string"',
    "  ? __angelPathToFileURL(__filename).href",
    "  : import.meta.url;",
  ].join("\n"),
);

source = source.replace(
  "var S6 = $S(import.meta.url)",
  'var S6 = (id) => id === "fs" ? __angelFs : $S(__angelModuleUrl)(id)',
);
source = source.replaceAll("import.meta.url", "__angelModuleUrl");
source = source.replaceAll(": __angelModuleUrl;", ": import.meta.url;");

fs.writeFileSync(bundlePath, source);
