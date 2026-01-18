"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";
import { Input } from "@heroui/input";
import { useState } from "react";

export const role = [
  { key: "admin", label: "Admin" },
  { key: "user", label: "User" },
];

export default function CustomModal({ isOpen, onOpenChange, onUserAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    status: "inActive",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const passwordChecks = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const allValid = Object.values(passwordChecks).every(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "confirmPassword") {
      setConfirmError(
        value !== formData.password ? "Passwords do not match." : "",
      );
    }
  };

  // Check if form is valid
  const isFormValid =
    formData.name &&
    formData.role &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    allValid &&
    formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    setMessage("");
    setConfirmError("");

    if (!allValid) {
      setMessage("❌ Please ensure your password meets all requirements.");
      addToast({
        title: "Invalid Password",
        description: "Please check your password requirements.",
        color: "danger",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setConfirmError("Passwords do not match.");
      addToast({
        title: "Password Mismatch",
        description: "Your passwords do not match.",
        color: "danger",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/addUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          status: formData.status,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        setMessage("✅ User added successfully!");
        addToast({
          title: "User Added",
          description: `${formData.name} has been added successfully!`,
          color: "success",
          classNames: {
            closeButton:
              "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
          },
        });

        setFormData({
          name: "",
          role: "",
          status: "inActive",
          email: "",
          password: "",
          confirmPassword: "",
        });

        // Call the refresh callback
        if (onUserAdded && typeof onUserAdded === "function") {
          onUserAdded();
        }

        // Close modal after success
        setTimeout(() => {
          onOpenChange(false);
        }, 500);
      } else {
        setMessage(`❌ ${data.error || "Something went wrong."}`);
        addToast({
          title: "Error",
          description: data.error || "Failed to add user. Try again.",
          color: "danger",
        });
      }
    } catch (error) {
      setLoading(false);
      setMessage("❌ Failed to add user. Try again.");
      addToast({
        title: "Error",
        description: "Network error. Please try again.",
        color: "danger",
      });
    }
  };

  const checkItem = (label, valid) => (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`w-2 h-2 rounded-full ${
          valid ? "bg-green-500" : "bg-red-500"
        }`}
      ></span>
      <span className={`${valid ? "text-green-600" : "text-red-600"}`}>
        {label}
      </span>
    </div>
  );

  return (
    <Modal
      backdrop="opaque"
      isOpen={isOpen}
      motionProps={{
        variants: {
          enter: { y: 0, opacity: 1, transition: { duration: 0.3 } },
          exit: { y: -20, opacity: 0, transition: { duration: 0.2 } },
        },
      }}
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 font-semibold">
              Add New User
              <p className="text-xs text-gray-500">
                Fill in the details below to create a new user account.
              </p>
            </ModalHeader>
            <ModalBody>
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <Input
                  id="name"
                  name="name"
                  label="Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  size="sm"
                />

                <Select
                  label="Select a role"
                  size="sm"
                  selectedKeys={formData.role ? [formData.role] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    setFormData((prev) => ({ ...prev, role: selected }));
                  }}
                >
                  {role.map((r) => (
                    <SelectItem key={r.key} value={r.key}>
                      {r.label}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  type="email"
                  id="email"
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  size="sm"
                />

                <Input
                  type="password"
                  id="password"
                  name="password"
                  label="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  size="sm"
                />
                <div className="mt-2 space-y-1 text-xs">
                  <p className="font-medium text-gray-600">
                    Password must include:
                  </p>
                  {checkItem("At least 8 characters", passwordChecks.length)}
                  {checkItem("1 uppercase letter", passwordChecks.upper)}
                  {checkItem("1 lowercase letter", passwordChecks.lower)}
                  {checkItem("1 number", passwordChecks.number)}
                  {checkItem(
                    "1 special character (!@#$%^&*)",
                    passwordChecks.special,
                  )}
                </div>

                <Input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  size="sm"
                  isInvalid={!!confirmError}
                  errorMessage={confirmError}
                />
              </form>

              {message && (
                <p
                  className={`text-center text-xs mt-2 ${
                    message.startsWith("✅") ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {message}
                </p>
              )}
            </ModalBody>
            <ModalFooter className="flex items-center gap-2">
              <Button
                color="danger"
                variant="light"
                onPress={onClose}
                size="sm"
              >
                Close
              </Button>
              <Button
                type="button"
                color="primary"
                className="w-full text-xs"
                isDisabled={loading || !isFormValid}
                onPress={handleSubmit}
              >
                {loading ? <Spinner size="sm" color="white" /> : "Add User"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
