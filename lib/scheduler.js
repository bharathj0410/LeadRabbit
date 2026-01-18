import cron from "node-cron";
import clientPromise from "@/lib/mongodb";

async function assignLeads() {
  // const now = new Date();
  // console.log("Running lead assignment at:", now.toLocaleString());

  try {
    const client = await clientPromise;
    if (!client) {
      console.error("MongoDB client unavailable for lead assignment");
      return;
    }
    const db = client.db(process.env.DB_NAME);

    const usersCollection = db.collection("users");
    const leadsCollection = db.collection("leads");
    const settingsCollection = db.collection("settings");

    // Fetch online users in stable order
    const onlineUsers = await usersCollection
      .find({ isOnline: true, isVerified: true })
      .sort({ email: 1 }) // ensures order is predictable
      .toArray();

    if (onlineUsers.length === 0) {
      return;
    }

    // Fetch unassigned leads
    const unassignedLeads = await leadsCollection
      .find({
        $or: [{ assignedTo: "" }, { assignedTo: null }],
      })
      .toArray();

    if (unassignedLeads.length === 0) {
      return;
    }

    // Get last assignment info
    const settings = await settingsCollection.findOne({
      name: "leadAssignment",
    });
    let lastIndex = settings?.lastAssignedIndex ?? -1; // default -1 so first = 0

    // Decide starting index
    let userIndex;
    const stillOnline = onlineUsers.find(
      (u) => u.email === settings?.lastAssignedUser,
    );

    if (settings?.lastAssignedUser && stillOnline) {
      // If last user is still online → move to next
      userIndex = (lastIndex + 1) % onlineUsers.length;
    } else {
      // If last user is offline → reuse same index
      userIndex = (lastIndex >= 0 ? lastIndex : 0) % onlineUsers.length;
    }

    // Round robin assignment
    for (const lead of unassignedLeads) {
      const user = onlineUsers[userIndex];

      await leadsCollection.updateOne(
        { _id: lead._id },
        { $set: { assignedTo: user.email } },
      );

      userIndex = (userIndex + 1) % onlineUsers.length;
    }

    // Update settings with new pointer + user
    const newLastIndex =
      (userIndex - 1 + onlineUsers.length) % onlineUsers.length;
    const newLastUser = onlineUsers[newLastIndex].email;

    await settingsCollection.updateOne(
      { name: "leadAssignment" },
      {
        $set: {
          lastAssignedIndex: newLastIndex,
          lastAssignedUser: newLastUser,
        },
      },
      { upsert: true },
    );
  } catch (err) {
    console.error("Error assigning leads:", err);
  }
}

// CRON Job - runs every 15 mins at :15
export function startCron() {
  // cron.schedule("15 10-18 * * *", assignLeads);
  // console.log("✅ Lead assignment cron started");
  assignLeads();
}
