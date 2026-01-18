"use client";
import React from "react";
import {
  BoltSlashIcon,
  BoltIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import Widget from "../components/widget";
import EmpTable from "./components/empTable";
import axios from "@/lib/axios";

export default function page() {
  const [activeCount, setActiveCount] = React.useState(0);
  const [inactiveCount, setInactiveCount] = React.useState(0);

  React.useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await axios.get("admin/addUser");
        const users = response.data?.users ?? [];

        let active = 0;
        let inactive = 0;

        users.forEach((user) => {
          if (user?.isOnline === true) {
            active += 1;
          } else {
            const status =
              typeof user?.status === "string"
                ? user.status.trim().toLowerCase()
                : undefined;
            if (status === "active") {
              active += 1;
            } else {
              inactive += 1;
            }
          }
        });

        setActiveCount(active);
        setInactiveCount(inactive);
      } catch (error) {
        console.error("Failed to fetch employee counts", error);
        setActiveCount(0);
        setInactiveCount(0);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-600">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-xs font-medium mb-1">
                Team Management 👨‍💼
              </p>
              <h1 className="text-xl font-bold text-white mb-1">Employees</h1>
              <p className="text-indigo-100 text-xs">
                Manage team members and user accounts
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-white">
              <UserGroupIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-3 py-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 text-center shadow-sm">
            <div className="flex items-center justify-center mb-2">
              <BoltIcon className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-lg font-bold text-green-600">
              {activeCount}
            </div>
            <div className="text-[10px] text-gray-600">Active Users</div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 text-center shadow-sm">
            <div className="flex items-center justify-center mb-2">
              <BoltSlashIcon className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-lg font-bold text-red-600">
              {inactiveCount}
            </div>
            <div className="text-[10px] text-gray-600">Inactive Users</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-6">
        <EmpTable />
      </div>
    </div>
  );
}
