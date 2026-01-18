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
    const leadsCollection = db.collection("leads");

    // Get ALL leads for admin view (no filters whatsoever)
    const leads = await leadsCollection.find({}).toArray();

    return NextResponse.json(leads, { status: 200 });
  } catch (error) {
    console.error("❌ Error in admin getAllLeads:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching leads" },
      { status: 500 },
    );
  }
}
