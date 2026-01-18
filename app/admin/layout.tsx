"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  StarIcon,
  UserIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  UsersIcon as UsersIconSolid,
  StarIcon as StarIconSolid,
  UserIcon as UserIconSolid,
  LinkIcon as LinkIconSolid,
} from "@heroicons/react/24/solid";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Badge,
  Button,
  Divider,
} from "@heroui/react";
import {
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/solid";
import axios from "@/lib/axios";

type UserProfile = {
  name?: string;
  email?: string;
  role?: string;
  avatar?: string;
  isOnline?: boolean;
  isVerified?: boolean;
};

type Tab = {
  id: string;
  name: string;
  icon: any;
  iconActive: any;
  path: string;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("me");
        setUserProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Logout failed with status ${response.status}`);
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Failed to logout", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, router]);

  // Handle menu actions
  const handleMenuAction = useCallback(
    (key: any) => {
      if (key === "profile") {
        router.push("/admin/profile");
        return;
      }
      if (key === "settings") {
        router.push("/admin/profile");
        return;
      }
      if (key === "team_settings") {
        router.push("/admin");
        return;
      }
    },
    [router],
  );

  const tabs = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: HomeIcon,
      iconActive: HomeIconSolid,
      path: "/admin",
    },
    {
      id: "leads",
      name: "All Leads",
      icon: UserGroupIcon,
      iconActive: UserGroupIconSolid,
      path: "/admin/allLeads",
    },
    {
      id: "integration",
      name: "Integration",
      icon: LinkIcon,
      iconActive: LinkIconSolid,
      path: "/admin/connectors",
    },
    {
      id: "employees",
      name: "Employees",
      icon: UsersIcon,
      iconActive: UsersIconSolid,
      path: "/admin/employees",
    },
  ];

  const handleTabClick = (tab: Tab) => {
    router.push(tab.path);
  };

  const getActiveTab = () => {
    if (!pathname) return "dashboard";
    if (pathname === "/admin") return "dashboard";
    if (pathname.includes("/allLeads")) return "leads";
    if (pathname.includes("/connectors")) return "integration";
    if (pathname.includes("/employees")) return "employees";
    return "dashboard";
  };

  const activeTabId = getActiveTab();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <div className="flex-1 pb-16">{children}</div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-around px-2 py-1">
            {/* Dashboard Tab */}
            {tabs.slice(0, 1).map((tab) => {
              const isActive = activeTabId === tab.id;
              const Icon = isActive ? tab.iconActive : tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg transition-all duration-200 active:scale-95 ${
                    isActive ? "text-purple-600" : "text-gray-400"
                  }`}
                >
                  <Icon className="w-7 h-7 mb-0.5" />
                  <span className="text-[10px] font-medium">{tab.name}</span>
                </button>
              );
            })}

            {/* All Leads Tab */}
            {tabs.slice(1, 2).map((tab) => {
              const isActive = activeTabId === tab.id;
              const Icon = isActive ? tab.iconActive : tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg transition-all duration-200 active:scale-95 ${
                    isActive ? "text-purple-600" : "text-gray-400"
                  }`}
                >
                  <Icon className="w-7 h-7 mb-0.5" />
                  <span className="text-[10px] font-medium">{tab.name}</span>
                </button>
              );
            })}

            {/* Profile Dropdown - Middle Position (Bigger) */}
            <Dropdown placement="top">
              <DropdownTrigger>
                <button className="flex flex-col items-center justify-center min-w-[70px] -mt-4 transition-all duration-200 active:scale-95">
                  <div className="relative">
                    <Badge
                      color={userProfile?.isOnline ? "success" : "default"}
                      content=""
                      placement="bottom-right"
                      shape="circle"
                      size="sm"
                    >
                      <Avatar
                        size="md"
                        isBordered
                        name={userProfile?.name}
                        src={
                          userProfile?.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userProfile?.name || userProfile?.email || "Admin")}`
                        }
                        className="w-14 h-14"
                      />
                    </Badge>
                    {userProfile?.isVerified && (
                      <span className="absolute -top-0.5 -right-0.5 rounded-full bg-white p-[2px] text-purple-500 shadow-sm">
                        <CheckBadgeIcon className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 mt-0.5">
                    Admin
                  </span>
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="User Actions"
                variant="flat"
                onAction={handleMenuAction}
              >
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-bold">Signed in as</p>
                  <p className="font-bold">
                    {userProfile?.email?.split("@")[0]
                      ? `@${userProfile.email.split("@")[0]}`
                      : (userProfile?.email ?? "Unknown")}
                  </p>
                </DropdownItem>
                <DropdownItem key="settings">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 text-slate-400" />
                    <p>My Profile</p>
                  </div>
                </DropdownItem>
                <DropdownItem key="team_settings">
                  <div className="flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="w-5 text-slate-400" />
                    <p>Admin Tasks</p>
                  </div>
                </DropdownItem>
                <DropdownItem key="logout" color="danger">
                  <Divider className="mb-2" orientation="horizontal" />
                  <Button
                    className="w-full text-left"
                    color="danger"
                    isDisabled={isLoggingOut}
                    variant="flat"
                    onClick={handleLogout}
                  >
                    {isLoggingOut ? "Logging out..." : "Log Out"}
                  </Button>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* Integration Tab */}
            {tabs.slice(2, 3).map((tab) => {
              const isActive = activeTabId === tab.id;
              const Icon = isActive ? tab.iconActive : tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg transition-all duration-200 active:scale-95 ${
                    isActive ? "text-purple-600" : "text-gray-400"
                  }`}
                >
                  <Icon className="w-7 h-7 mb-0.5" />
                  <span className="text-[10px] font-medium">{tab.name}</span>
                </button>
              );
            })}

            {/* All Employee Tab */}
            {tabs.slice(3, 4).map((tab) => {
              const isActive = activeTabId === tab.id;
              const Icon = isActive ? tab.iconActive : tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg transition-all duration-200 active:scale-95 ${
                    isActive ? "text-purple-600" : "text-gray-400"
                  }`}
                >
                  <Icon className="w-7 h-7 mb-0.5" />
                  <span className="text-[10px] font-medium">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
