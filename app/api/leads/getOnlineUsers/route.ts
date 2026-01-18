// pages/api/test.ts or app/api/test/route.ts
import { NextRequest, NextResponse } from "next/server";

import clientPromise from "@/lib/mongodb";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Prevent execution during build time
  if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI) {
    return NextResponse.json(
      { error: "MongoDB not configured" },
      { status: 500 }
    );
  }

  try {
    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    const db = client!.db(process.env.DB_NAME);

    const collection = db.collection("users");
    const leads = await collection.find({ isOnline: true }).toArray();

    if (leads) {
      return NextResponse.json(leads, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Failed to retrieve leads" },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error("Error Retrieving Employee from DB !!", err);

    return NextResponse.json(
      { error: "Error Retrieving Employee from DB !!" },
      { status: 500 },
    );
  }
}
