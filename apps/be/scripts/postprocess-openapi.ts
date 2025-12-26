import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const REQUEST_TS_PATH = resolve(
  process.cwd(),
  "../../packages/api-client/generated/core/request.ts"
);

const replaceOnce = (source: string, from: string, to: string) => {
  if (!source.includes(from)) return source;
  return source.replace(from, to);
};

const replaceRegexOnce = (source: string, from: RegExp, to: string) => {
  if (!from.test(source)) return source;
  return source.replace(from, to);
};

async function main() {
  const original = await readFile(REQUEST_TS_PATH, "utf8");

  let next = original;

  next = replaceOnce(
    next,
    "import FormData from 'form-data';\n",
    "const FormDataCtor = globalThis.FormData;\n"
  );
  next = replaceOnce(
    next,
    "const FormData = globalThis.FormData;\n",
    "const FormDataCtor = globalThis.FormData;\n"
  );

  next = replaceRegexOnce(
    next,
    /const\s+formData\s*=\s*new\s+FormData\(\);/,
    "if (!FormDataCtor) {\n            return undefined;\n        }\n\n        const formData = new FormDataCtor();"
  );

  next = replaceRegexOnce(
    next,
    /const\s+formHeaders\s*=\s*typeof\s+formData\?\.getHeaders\s*===\s*'function'\s*&&\s*formData\?\.getHeaders\(\)\s*\|\|\s*\{\}/,
    "const formHeaders = typeof (formData as any)?.getHeaders === 'function' && (formData as any)?.getHeaders() || {}"
  );

  if (next !== original) {
    await writeFile(REQUEST_TS_PATH, next, "utf8");
  }
}

await main();
