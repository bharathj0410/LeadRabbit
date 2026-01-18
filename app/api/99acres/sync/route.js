import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { parseStringPromise } from "xml2js";

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db("leadrabbit");

    const accounts = await db
      .collection("99acresIntegrations")
      .find({ isActive: true })
      .toArray();

    let totalLeadsSynced = 0;

    for (const account of accounts) {
      const lastSync = account.lastSync || new Date(Date.now() - 30 * 86400000); // 30 days ago
      const endDate = new Date();

      // 99acres allows max 2 days difference
      const startDate = new Date(Math.max(lastSync.getTime(), endDate.getTime() - 2 * 86400000));

      const requestXml = `<?xml version='1.0'?><query><user_name>${account.username}</user_name><pswd>${account.password}</pswd><start_date>${startDate.toISOString().slice(0, 19).replace('T', ' ')}</start_date><end_date>${endDate.toISOString().slice(0, 19).replace('T', ' ')}</end_date></query>`;

      const response = await fetch(
        "https://www.99acres.com/99api/v1/getmy99Response/OeAuXClO43hwseaXEQ/uid/",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `xml=${encodeURIComponent(requestXml)}`,
        }
      );

      const xmlText = await response.text();
      const parsedXml = await parseStringPromise(xmlText);

      if (parsedXml.Xml.$.ActionStatus === "true" && parsedXml.Xml.Resp) {
        const responses = Array.isArray(parsedXml.Xml.Resp)
          ? parsedXml.Xml.Resp
          : [parsedXml.Xml.Resp];

        for (const resp of responses) {
          const qryDtl = resp.QryDtl[0];
          const cntctDtl = resp.CntctDtl[0];

          const leadData = {
            source: "99acres",
            accountId: account._id,
            username: account.username,
            queryId: qryDtl.$.TblId,
            responseType: qryDtl.$.ResType,
            productId: qryDtl.ProdId[0]._,
            productStatus: qryDtl.ProdId[0].$.Status,
            productType: qryDtl.ProdId[0].$.Type,
            propertyDescription: qryDtl.CmpctLabl[0],
            queryInfo: qryDtl.QryInfo[0],
            receivedOn: new Date(qryDtl.RcvdOn[0].replace(/\//g, '-')),
            name: cntctDtl.Name[0],
            email: cntctDtl.Email[0],
            phone: cntctDtl.Phone[0],
            createdAt: new Date(),
          };

          // Check if lead already exists
          const existingLead = await db.collection("leads").findOne({
            source: "99acres",
            queryId: leadData.queryId,
          });

          if (!existingLead) {
            await db.collection("leads").insertOne(leadData);
            totalLeadsSynced++;
          }
        }
      }

      // Update last sync time
      await db.collection("99acresIntegrations").updateOne(
        { _id: account._id },
        { $set: { lastSync: endDate } }
      );
    }

    return NextResponse.json({ success: true, leadsSynced: totalLeadsSynced });
  } catch (error) {
    console.error("Error syncing 99acres leads:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
