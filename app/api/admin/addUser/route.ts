import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
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
      console.error("MongoDB client unavailable");
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    const db = client!.db(process.env.DB_NAME);
    const usersCollection = db.collection("users");

    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ users }, { status: 200 });
  } catch (err) {
    console.error("❌ Error retrieving users from DB:", err);

    return NextResponse.json(
      { error: "Server error while fetching users" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  // Prevent execution during build time
  if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI) {
    return NextResponse.json(
      { error: "MongoDB not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { name, role, status, email, password } = body;

    // Connect to MongoDB
    const client = await clientPromise;
    if (!client) {
      console.error("MongoDB client unavailable");
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    const db = client!.db(process.env.DB_NAME);
    const usersCollection = db.collection("users");
    const employeesCollection = db.collection("employees");

    // Check if email already exists
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const now = new Date();
    const userId = new ObjectId();
    const newUser = {
      _id: userId,
      name,
      role,
      status: status || "active",
      email,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
      isVerified: false,
      avatar: null,
    };

    // Generate a unique Employee ID (e.g., EMP001, EMP002, etc.)
    const lastEmployee = await employeesCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    let employeeNumber = 1;
    if (lastEmployee.length > 0 && lastEmployee[0].employeeId) {
      const lastId = lastEmployee[0].employeeId;
      const match = lastId.match(/\d+/);
      if (match) {
        employeeNumber = parseInt(match[0], 10) + 1;
      }
    }

    const employeeId = `EMP${String(employeeNumber).padStart(3, "0")}`;

    // Create employee profile
    const newEmployee = {
      userId: userId,
      employeeId: employeeId,
      fullName: name,
      email: email,
      createdAt: now,
      updatedAt: now,
      isVerified: false,
    };

    await usersCollection.insertOne(newUser);
    await employeesCollection.insertOne(newEmployee);

    return NextResponse.json(
      {
        message: "✅ User added successfully",
        user: { name, role, email, status, employeeId },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("❌ Error adding user to DB:", err);

    return NextResponse.json(
      { error: "Server error while adding user" },
      { status: 500 },
    );
  }
}
