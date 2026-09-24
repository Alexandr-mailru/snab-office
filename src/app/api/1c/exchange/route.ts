import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { importCommerceML } from "@/lib/commerceml";
import {
  getOneCCredentials,
  isOneCAuthorized,
  MAX_IMPORT_BYTES,
  oneCNotConfigured,
  oneCUnauthorized,
} from "@/lib/onec-auth";

/**
 * Обмен с 1С (CommerceML / Bitrix-совместимый протокол).
 * Требует HTTP Basic Auth: ONEC_USER / ONEC_PASSWORD.
 *
 * Цикл: checkauth → init → file (POST body) → import?filename=
 */
function exchangeDir() {
  return path.join(process.cwd(), ".data", "1c-exchange");
}

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._\-\u0400-\u04FF]/g, "_").slice(0, 180) || "upload.xml";
}

export async function GET(request: Request) {
  if (!getOneCCredentials()) return oneCNotConfigured();
  if (!isOneCAuthorized(request)) return oneCUnauthorized();

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "info";
  const type = searchParams.get("type") ?? "catalog";

  if (mode === "info") {
    return new NextResponse(
      [
        "SnabOffice CommerceML endpoint",
        `type=${type}`,
        `file_limit=${MAX_IMPORT_BYTES}`,
        "Modes: checkauth, init, file, import",
      ].join("\n"),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  if (mode === "checkauth") {
    return new NextResponse(["success", "snaboffice-session", "ok"].join("\n"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (mode === "init") {
    return new NextResponse(["zip=no", `file_limit=${MAX_IMPORT_BYTES}`].join("\n"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (mode === "import") {
    const filename = searchParams.get("filename");
    if (!filename) {
      return new NextResponse("failure\nfilename required", {
        status: 400,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    try {
      const filePath = path.join(exchangeDir(), safeFilename(filename));
      const xml = await readFile(filePath, "utf8");
      const result = await importCommerceML(xml);
      return new NextResponse(
        `success\ncategories=${result.categories}\nproducts=${result.products}`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
    } catch (error) {
      console.error(error);
      return new NextResponse("failure\nimport error", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }

  return new NextResponse("failure\nunknown mode", {
    status: 400,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  if (!getOneCCredentials()) return oneCNotConfigured();
  if (!isOneCAuthorized(request)) return oneCUnauthorized();

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  if (mode === "file") {
    const filename = safeFilename(searchParams.get("filename") || "catalog.xml");
    try {
      const buf = Buffer.from(await request.arrayBuffer());
      if (buf.byteLength > MAX_IMPORT_BYTES) {
        return new NextResponse(`failure\nfile too large (max ${MAX_IMPORT_BYTES})`, {
          status: 413,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      await mkdir(exchangeDir(), { recursive: true });
      await writeFile(path.join(exchangeDir(), filename), buf);
      return new NextResponse("success", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } catch (error) {
      console.error(error);
      return new NextResponse("failure\nfile save error", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }

  if (mode !== "import") {
    return new NextResponse("failure\nuse mode=import or mode=file", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let xml = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return new NextResponse("failure\nfile required", {
          status: 400,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      if (file.size > MAX_IMPORT_BYTES) {
        return new NextResponse(`failure\nfile too large (max ${MAX_IMPORT_BYTES})`, {
          status: 413,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      xml = await file.text();
    } else {
      const filename = searchParams.get("filename");
      if (filename) {
        xml = await readFile(path.join(exchangeDir(), safeFilename(filename)), "utf8");
      } else {
        xml = await request.text();
      }
    }

    if (!xml.trim()) {
      return new NextResponse("failure\nempty payload", {
        status: 400,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const result = await importCommerceML(xml);
    return new NextResponse(
      `success\ncategories=${result.categories}\nproducts=${result.products}`,
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  } catch (error) {
    console.error(error);
    return new NextResponse("failure\nimport error", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
