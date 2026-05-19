import { isexe, sync as isexeSync } from "isexe";
import { delimiter as pathDelimiter, join, posix, sep } from "node:path";

interface NodeWhichOptions {
  all?: boolean;
  delimiter?: string;
  nothrow?: boolean;
  path?: string;
  pathExt?: string;
}

interface PathInfo {
  pathEnv: string[];
  pathExt: string[];
  pathExtExe?: string;
}

const isWindows = process.platform === "win32";
const slashPattern = new RegExp(
  `[${posix.sep}${sep === posix.sep ? "" : sep}]`.replace(/(\\)/g, "\\$1"),
);
const relativePattern = new RegExp(`^\\.${slashPattern.source}`);

export function nodeWhich(
  command: string,
  options: NodeWhichOptions & { all: true; nothrow: true },
): Promise<string[] | null>;
export function nodeWhich(
  command: string,
  options: NodeWhichOptions & { all: true },
): Promise<string[]>;
export function nodeWhich(
  command: string,
  options: NodeWhichOptions & { nothrow: true },
): Promise<string | null>;
export function nodeWhich(
  command: string,
  options?: NodeWhichOptions,
): Promise<string>;
export async function nodeWhich(
  command: string,
  options: NodeWhichOptions = {},
) {
  const { pathEnv, pathExt, pathExtExe } = getPathInfo(command, options);
  const found: string[] = [];

  for (const envPart of pathEnv) {
    const pathPart = getPathPart(envPart, command);

    for (const extension of pathExt) {
      const withExtension = pathPart + extension;
      const executable = await isexe(withExtension, {
        ignoreErrors: true,
        pathExt: pathExtExe,
      });
      if (executable) {
        if (!options.all) return withExtension;
        found.push(withExtension);
      }
    }
  }

  if (options.all && found.length) return found;
  if (options.nothrow) return null;

  throw notFoundError(command);
}

export function nodeWhichSync(
  command: string,
  options: NodeWhichOptions & { all: true; nothrow: true },
): string[] | null;
export function nodeWhichSync(
  command: string,
  options: NodeWhichOptions & { all: true },
): string[];
export function nodeWhichSync(
  command: string,
  options: NodeWhichOptions & { nothrow: true },
): string | null;
export function nodeWhichSync(
  command: string,
  options?: NodeWhichOptions,
): string;
export function nodeWhichSync(command: string, options: NodeWhichOptions = {}) {
  const { pathEnv, pathExt, pathExtExe } = getPathInfo(command, options);
  const found: string[] = [];

  for (const envPart of pathEnv) {
    const pathPart = getPathPart(envPart, command);

    for (const extension of pathExt) {
      const withExtension = pathPart + extension;
      const executable = isexeSync(withExtension, {
        ignoreErrors: true,
        pathExt: pathExtExe,
      });
      if (executable) {
        if (!options.all) return withExtension;
        found.push(withExtension);
      }
    }
  }

  if (options.all && found.length) return found;
  if (options.nothrow) return null;

  throw notFoundError(command);
}

function getPathInfo(
  command: string,
  {
    delimiter = pathDelimiter,
    path = process.env.PATH,
    pathExt = process.env.PATHEXT,
  }: NodeWhichOptions,
): PathInfo {
  const pathEnv = command.match(slashPattern)
    ? [""]
    : [...(isWindows ? [process.cwd()] : []), ...(path ?? "").split(delimiter)];

  if (isWindows) {
    const pathExtExe =
      pathExt ?? [".EXE", ".CMD", ".BAT", ".COM"].join(delimiter);
    const extensions = pathExtExe
      .split(delimiter)
      .flatMap((item) => [item, item.toLowerCase()]);
    if (command.includes(".") && extensions[0] !== "") {
      extensions.unshift("");
    }
    return { pathEnv, pathExt: extensions, pathExtExe };
  }

  return { pathEnv, pathExt: [""] };
}

function getPathPart(raw: string, command: string): string {
  const pathPart = /^".*"$/.test(raw) ? raw.slice(1, -1) : raw;
  const prefix =
    !pathPart && relativePattern.test(command) ? command.slice(0, 2) : "";
  return prefix + join(pathPart, command);
}

function notFoundError(command: string): Error & { code: "ENOENT" } {
  return Object.assign(new Error(`not found: ${command}`), {
    code: "ENOENT" as const,
  });
}
