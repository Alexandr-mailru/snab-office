import { NextRequest, NextResponse } from "next/server";
import { suggestSearch } from "@/lib/catalog";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const data = await suggestSearch(q);
  return NextResponse.json(data);
}
