// pages/api/test.ts or app/api/test/route.ts
import { NextRequest, NextResponse } from "next/server";

import { startCron } from "@/lib/scheduler";

export async function GET(req: NextRequest) {
  try {
    startCron();

    return NextResponse.json(
      { message: "Lead assignment cron started" },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error", err);

    return NextResponse.json({ err }, { status: 500 });
  }
}
