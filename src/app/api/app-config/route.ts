import { NextResponse } from "next/server";
import { lifeModes } from "@/lib/lifemode/data";

export function GET() {
  return NextResponse.json({
    appName: "LifeMode",
    modes: lifeModes,
  });
}
