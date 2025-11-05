"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/store/adminStore";
import Link from "next/link";
export default function AdminDashboard() {
  const router = useRouter();
  const { dashboardData, fetchDashboard, logout, loading } = useAdminStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (!dashboardData)
    return (
      <div className="text-center mt-10">
        <p>Session expired. Please log in again.</p>
        <button
          onClick={() => router.push("/admin/login")}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        >
          Go to Login
        </button>
      </div>
    );

  const { admin, totalDoctors, totalPatients, totalAppointments } =
    dashboardData;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white flex justify-between items-center p-4">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <button
          onClick={() => {
            logout();
            router.push("/admin/login");
          }}
          className="bg-red-500 px-3 py-1 rounded"
        >
          Logout
        </button>
      </header>

      <main className="p-6">
        <h2 className="text-lg font-semibold mb-4">
          Welcome, {admin.username || "Admin"} 👋
        </h2>

        <div className="grid grid-cols-3 gap-4">
          <Link
            href="/admin/doctors"
            className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition"
          >
            <h3 className="text-lg font-medium mb-2">Doctors</h3>
            <p className="text-2xl font-bold">{totalDoctors}</p>
          </Link>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-medium mb-2">Patients</h3>
            <p className="text-2xl font-bold">{totalPatients}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-medium mb-2">Appointments</h3>
            <p className="text-2xl font-bold">{totalAppointments}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
