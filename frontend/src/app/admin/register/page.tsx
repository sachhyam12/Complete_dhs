"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { adminService } from "@/service/adminService";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    adminKey: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await adminService.register(
        form.username,
        form.email,
        form.password,
        form.adminKey
      );
      setMessage("Admin registered successfully!");
      setTimeout(() => router.push("/admin/login"), 1500);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-6 bg-white rounded-lg shadow-md"
      >
        <h2 className="text-2xl font-bold text-center mb-4">
          Admin Registration
        </h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 mb-3 rounded">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-100 text-green-600 p-2 mb-3 rounded">
            {message}
          </div>
        )}

        <div className="mb-3">
          <label className="block mb-1 text-gray-700">Name</label>
          <input
            type="text"
            name="username"
            placeholder="username"
            className="w-full border border-gray-300 rounded p-2"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            className="w-full border border-gray-300 rounded p-2"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="block mb-1 text-gray-700">Password</label>
          <input
            type="password"
            name="password"
            className="w-full border border-gray-300 rounded p-2"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-gray-700">
            Admin Registration Key
          </label>
          <input
            type="text"
            name="adminKey"
            className="w-full border border-gray-300 rounded p-2"
            value={form.adminKey}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-70"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-sm text-gray-500 text-center mt-3">
          Already an admin?{" "}
          <a href="/admin/login" className="text-blue-600 hover:underline">
            Login here
          </a>
        </p>
      </form>
    </div>
  );
}
