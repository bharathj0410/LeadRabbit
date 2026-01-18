// pages/api/test.ts or app/api/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import clientPromise from "@/lib/mongodb";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // const email = req.nextUrl.searchParams.get("email");
    const body = await req.json();
    const password = body.password;
    const email = body.email;
    // const saltRounds = 10;
    // const hashedPassword = await bcrypt.hash(password, saltRounds);

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    const db = client!.db(process.env.DB_NAME);
    let user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "UserID not found !!" },
        { status: 404 },
      );
    }
    const isValid = bcrypt.compareSync(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid credentials !!" },
        { status: 401 },
      );
    }

    const token = jwt.sign(
      { email, role: user.role }, // payload
      process.env.JWT_SECRET!, // secret
      { expiresIn: "1h" }, // token valid for 1 hour
    );
    const res = NextResponse.json(
      { success: true, message: "Login successful" },
      { status: 200 },
    );

    res.cookies.set("appToken", token, {
      httpOnly: true,
      sameSite: "lax", // Changed from "strict" to "lax" to allow OAuth redirects
      // secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: "/",
    });
    await db.collection("users").findOneAndUpdate(
      { email }, // Filter
      { $set: { isOnline: true } }, // Update operation
      { returnDocument: "after" }, // Options (return updated doc)
    );

    return res;
  } catch (err) {
    console.error("Error Retrieving Employee from DB !!", err);

    return NextResponse.json(
      { error: "Error Retrieving Employee from DB !!" },
      { status: 500 },
    );
  }
}
