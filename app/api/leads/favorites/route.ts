import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { resolveAuthenticatedUser } from "@/app/api/_utils/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthenticatedUser(req);

    if (auth.status !== 200) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const db = auth.db;
    const usersCollection = db.collection("users");

    // Get user's favorites
    const user = await usersCollection.findOne(
      { email: auth.email },
      { projection: { favorites: 1 } }
    );

    const favorites = user?.favorites || [];

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}
