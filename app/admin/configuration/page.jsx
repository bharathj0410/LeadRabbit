"use client";

import Image from "next/image";

export default function ConfigurationPage() {
  return (
    <section className="flex flex-col items-center gap-6 py-12 px-4 text-center">
      <div className="flex items-center gap-2">
        <div className="w-16 h-16 relative">
          <Image src="/icons/facebookIcon.svg" alt="Facebook" fill sizes="64px" />
        </div>
        <span className="text-2xl text-gray-400 font-bold">+</span>
        <div className="w-16 h-16 relative">
          <Image src="/icons/instagramIcon.svg" alt="Instagram" fill sizes="64px" />
        </div>
      </div>
      <div className="max-w-xl space-y-3">
        <h1 className="text-2xl font-semibold">Connector Configuration</h1>
        <p className="text-sm text-default-500">
          Manage authentication and permissions for your lead connectors.
          Configure OAuth credentials, webhook endpoints, and data sync
          preferences without leaving the dashboard.
        </p>
      </div>
      <div className="rounded-xl border border-default-200 bg-white p-6 shadow-sm text-left max-w-lg w-full">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-medium">Meta Lead Ads</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Facebook + Instagram</span>
        </div>
        <p className="text-sm text-default-500 mb-4">
          Use the Facebook Developer console to create or rotate app secrets.
          Once you have new credentials, update them here to keep the
          integration online for both Facebook and Instagram leads.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-default-600">
          <li>Open your Facebook Developer dashboard.</li>
          <li>Create or select your Lead Ads app.</li>
          <li>Copy the App ID and App Secret.</li>
          <li>
            Paste the credentials into the secure form provided by your ops
            team.
          </li>
        </ol>
        <p className="text-xs text-default-400 mt-4">
          Tip: rotate secrets every 90 days as part of your security hygiene.
        </p>
      </div>
    </section>
  );
}
