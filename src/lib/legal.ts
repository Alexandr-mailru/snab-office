import { readFileSync } from "fs";
import path from "path";

export function readLegalHtml(filename: string) {
  if (!/^[a-z0-9._-]+\.html$/i.test(filename)) {
    throw new Error("Invalid legal document name");
  }
  return readFileSync(path.join(process.cwd(), "content", "legal", filename), "utf8");
}
