"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/store/adminStore";
import { adminService } from "@/service/adminService";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDoctorsPage() {
  const {
    doctors,
    doctorsMeta,
    fetchDoctors,
    deleteDoctor,
    toggleDoctorStatus,
    loading,
  } = useAdminStore();

  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleAddDoctor = () => {
    router.push("/admin/add-doctor");
  };

  if (loading) return <p>Loading Doctors......</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Doctors Management</h1>
        <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </header>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Doctors List</h2>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleAddDoctor}
          >
            + Add Doctor
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-6">Loading...</p>
        ) : (
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2 border-b">Name</th>
                <th className="px-4 py-2 border-b">Email</th>
                <th className="px-4 py-2 border-b">Status</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors && doctors.length > 0 ? (
                doctors.map((doc) => (
                  <tr key={doc._id} className="border-t">
                    <td className="px-4 py-2">{doc.name || doc.name || "-"}</td>
                    <td className="px-4 py-2">{doc.email}</td>
                    <td className="px-4 py-2">
                      {doc.isActive ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => toggleDoctorStatus(doc._id)}
                        className="text-blue-600 hover:underline mr-4"
                      >
                        {doc.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={async () => {
                          if (
                            confirm(
                              "Are you sure you want to delete this doctor?"
                            )
                          ) {
                            deleteDoctor(doc._id);
                          }
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">
                    No doctors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {doctorsMeta && (
          <p className="mt-4 text-sm text-gray-600">
            Showing {doctorsMeta.page} of{" "}
            {Math.ceil(doctorsMeta.total / doctorsMeta.limit)} pages
          </p>
        )}
      </div>
    </div>
  );
}
