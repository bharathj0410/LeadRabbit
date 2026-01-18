import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("leadrabbit");

    const accounts = await db
      .collection("99acresIntegrations")
      .find({})
      .toArray();

    // For each account, count total leads
    const accountsWithLeads = await Promise.all(
      accounts.map(async (account) => {
        const leadCount = await db.collection("leads").countDocuments({
          source: "99acres",
          accountId: account._id,
        });
        return {
          ...account,
          totalLeads: leadCount,
        };
      })
    );

    return NextResponse.json(accountsWithLeads);
  } catch (error) {
    console.error("Error fetching 99acres accounts:", error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}

export async function POST(request) {
  try {
    const { accountId, action } = await request.json();

    const client = await clientPromise;
    const db = client.db("leadrabbit");

    if (action === "enable" || action === "disable") {
      await db.collection("99acresIntegrations").updateOne(
        { _id: new ObjectId(accountId) },
        {
          $set: {
            isActive: action === "enable",
            lastUpdated: new Date(),
          },
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating 99acres account:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { accountId } = await request.json();

    const client = await clientPromise;
    const db = client.db("leadrabbit");

    // Delete the account
    await db.collection("99acresIntegrations").deleteOne({
      _id: new ObjectId(accountId),
    });

    // Optionally delete associated leads
    // await db.collection("leads").deleteMany({
    //   source: "99acres",
    //   accountId: new ObjectId(accountId),
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting 99acres account:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
