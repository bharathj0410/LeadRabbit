"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Avatar,
  Chip,
  Divider,
  Link,
  Breadcrumbs,
  BreadcrumbItem,
} from "@heroui/react";
import {
  UserIcon,
  CheckBadgeIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  IdentificationIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import axios from "@/lib/axios";

function buildDataUrl(file) {
  if (!file?.type || !file?.data) return null;
  return `data:${file.type};base64,${file.data}`;
}

const parseBooleanFlag = (value) => {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }
  return false;
};

function openFileInNewTab(file) {
  if (!file?.data || !file?.type) return;

  const byteCharacters = window.atob(file.data);
  const byteArrays = [];
  const sliceSize = 1024;

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i += 1) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    byteArrays.push(new Uint8Array(byteNumbers));
  }

  const blob = new Blob(byteArrays, { type: file.type });
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, "_blank", "noopener,noreferrer");

  if (!newWindow) {
    URL.revokeObjectURL(url);
    return;
  }

  const revokeUrl = () => {
    URL.revokeObjectURL(url);
    newWindow.removeEventListener("beforeunload", revokeUrl);
  };

  newWindow.addEventListener("beforeunload", revokeUrl);
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.employeeId;

  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeId) {
        setError("Employee ID is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(`admin/employees/${employeeId}`);
        setEmployee(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch employee profile", err);
        setError("Failed to load employee profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  const handleVerifyEmployee = async () => {
    if (!employeeId) return;

    const user = employee?.user;
    const isCurrentlyVerified = parseBooleanFlag(user?.isVerified);
    const shouldVerify = !isCurrentlyVerified;

    setIsVerifying(true);
    try {
      const response = await axios.put(`admin/employees/${employeeId}`, {
        action: shouldVerify ? "verify" : "unverify",
      });

      if (response.status === 200) {
        setEmployee((prev) => ({
          ...prev,
          user: {
            ...prev.user,
            isVerified: shouldVerify,
          },
          profile: prev.profile
            ? {
                ...prev.profile,
                isVerified: shouldVerify,
                verifiedAt: shouldVerify
                  ? (response.data?.verifiedAt ?? new Date().toISOString())
                  : null,
              }
            : prev.profile,
        }));
      }
    } catch (error) {
      console.error("Failed to update verification status", error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded animate-pulse"></div>
                <div>
                  <div className="w-32 h-4 bg-white/20 rounded mb-2 animate-pulse"></div>
                  <div className="w-48 h-5 bg-white/20 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="px-3 pb-6">
          <div className="space-y-3 mt-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm animate-pulse"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-3 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-600 via-red-500 to-pink-600">
          <div className="px-4 py-6">
            <div className="flex items-center gap-3">
              <Button
                isIconOnly
                variant="light"
                className="text-white"
                onPress={() => router.back()}
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Button>
              <div>
                <p className="text-red-100 text-xs font-medium mb-1">
                  Error 🚫
                </p>
                <h1 className="text-xl font-bold text-white mb-1">
                  Failed to Load Profile
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 pb-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm text-center mt-3">
            <p className="text-gray-600 mb-4 text-sm">{error}</p>
            <div className="flex gap-2">
              <Button
                variant="flat"
                size="sm"
                className="flex-1"
                onPress={() => router.back()}
              >
                Go Back
              </Button>
              <Button
                color="primary"
                size="sm"
                className="flex-1"
                onPress={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const user = employee?.user ?? null;
  const profile = employee?.profile ?? null;
  const userVerified = parseBooleanFlag(user?.isVerified);
  const profileVerified = parseBooleanFlag(profile?.isVerified);
  const aadhaarUrl = buildDataUrl(profile?.aadhaarFile ?? null);
  const panUrl = buildDataUrl(profile?.panFile ?? null);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                isIconOnly
                variant="light"
                className="text-white"
                onPress={() => router.back()}
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Button>
              <div>
                <p className="text-blue-100 text-xs font-medium mb-1">
                  Employee Profile 👤
                </p>
                <h1 className="text-xl font-bold text-white mb-1">
                  {profile?.fullName || user?.name || "Employee Details"}
                </h1>
                <p className="text-blue-100 text-xs">
                  Complete profile information and verification status
                </p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-white">
              <UserIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-6">
        {!profile ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 text-center shadow-sm">
            <UserCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              No Profile Submitted
            </h3>
            <p className="text-sm text-gray-600">
              This user has not submitted their profile details yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Profile Header Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <Avatar
                    isBordered
                    radius="lg"
                    size="lg"
                    src={user?.avatar ?? undefined}
                  />
                  {userVerified && (
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-blue-500 p-1 text-white shadow-lg">
                      <CheckBadgeIcon className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    {profile.fullName || user?.name || "—"}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <EnvelopeIcon className="w-3 h-3" />
                      {user?.email ?? "—"}
                    </div>
                    <div className="flex items-center gap-1">
                      <PhoneIcon className="w-3 h-3" />
                      {profile.mobileNumber || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {userVerified && (
                <Chip
                  size="sm"
                  color="success"
                  variant="flat"
                  startContent={<CheckBadgeIcon className="w-3 h-3" />}
                  className="mb-3"
                >
                  Verified Account
                </Chip>
              )}

              {profile && (
                <Button
                  color={userVerified ? "warning" : "primary"}
                  size="sm"
                  className="w-full"
                  isLoading={isVerifying}
                  onPress={handleVerifyEmployee}
                  startContent={
                    !isVerifying && <CheckBadgeIcon className="w-4 h-4" />
                  }
                >
                  {userVerified ? "Unverify Profile" : "Verify Profile"}
                </Button>
              )}

              {profile.verifiedAt && (
                <div className="text-xs text-green-600 font-medium mt-2">
                  ✅ Verified on{" "}
                  {new Date(profile.verifiedAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Personal Information */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
              <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                <UserCircleIcon className="w-4 h-4 text-blue-500" />
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Gender
                  </label>
                  <p className="text-gray-900">{profile.gender || "—"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Date of Birth
                  </label>
                  <p className="text-gray-900">{profile.dateOfBirth || "—"}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Qualification
                  </label>
                  <p className="text-gray-900">
                    {profile.highestQualification || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
              <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                <MapPinIcon className="w-4 h-4 text-green-500" />
                Address Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Current Address
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-900">
                    {profile.currentAddress || "Not provided"}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Permanent Address
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-xs text-gray-900">
                    {profile.permanentAddress || "Not provided"}
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-sm">
              <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                <DocumentTextIcon className="w-4 h-4 text-purple-500" />
                Identity Documents
              </h3>
              <div className="space-y-3">
                {/* Aadhaar Card */}
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <IdentificationIcon className="w-4 h-4 text-orange-500" />
                    <h4 className="text-sm font-semibold text-gray-900">
                      Aadhaar Card
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="font-medium text-gray-600">
                        Number:{" "}
                      </span>
                      <span className="text-gray-900">
                        {profile.aadhaarNumber || "—"}
                      </span>
                    </div>
                    {aadhaarUrl && (
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="w-full"
                        onPress={() => openFileInNewTab(profile?.aadhaarFile)}
                        startContent={<DocumentTextIcon className="w-3 h-3" />}
                      >
                        View Document
                      </Button>
                    )}
                  </div>
                </div>

                {/* PAN Card */}
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <IdentificationIcon className="w-4 h-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-gray-900">
                      PAN Card
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="font-medium text-gray-600">
                        Number:{" "}
                      </span>
                      <span className="text-gray-900">
                        {profile.panNumber || "—"}
                      </span>
                    </div>
                    {panUrl && (
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="w-full"
                        onPress={() => openFileInNewTab(profile?.panFile)}
                        startContent={<DocumentTextIcon className="w-3 h-3" />}
                      >
                        View Document
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
