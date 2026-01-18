import { NextRequest } from "next/server";
import { Db } from "mongodb";
import jwt from "jsonwebtoken";

import clientPromise from "@/lib/mongodb";

export type AuthenticatedUser = {
  status: 200;
  db: Db;
  email: string;
  role: string;
  userDoc: Record<string, unknown>;
};

export type AuthFailure = {
  status: 400 | 401 | 403 | 404 | 500 | 503;
  error: string;
};

export async function resolveAuthenticatedUser(
  req: NextRequest,
): Promise<AuthenticatedUser | AuthFailure> {
  // Handle build time when environment variables might not be available
  if (!process.env.JWT_SECRET) {
    return { status: 500, error: "Server misconfiguration" };
  }

  // Prevent execution during build time
  if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI) {
    return { status: 500, error: "Database not configured" };
  }

  const token = req.cookies.get("appToken")?.value;

  if (!token) {
    return { status: 401, error: "Unauthorized" };
  }

  const secret = process.env.JWT_SECRET;

  let decoded: { email?: string; role?: string };

  try {
    decoded = jwt.verify(token, secret) as { email?: string; role?: string };
  } catch {
    return { status: 403, error: "Invalid token" };
  }

  const email = decoded.email;
  const role = decoded.role;

  if (!email || !role) {
    return { status: 400, error: "Invalid token payload" };
  }

  try {
    const client = await clientPromise;
    if (!client) {
      console.error("MongoDB client unavailable (auth)");
      return { status: 503, error: "Database unavailable" } as const;
    }
    const db = client!.db(process.env.DB_NAME);
    const usersCollection = db.collection("users");

    const userDoc = await usersCollection.findOne({ email });

    if (!userDoc) {
      return { status: 404, error: "User not found" };
    }

    return {
      status: 200,
      db,
      email,
      role,
      userDoc,
    };
  } catch (error) {
    console.error("Database connection error:", error);
    return { status: 500, error: "Database connection failed" };
  }
}
