import { create } from "zustand";
import { adminService } from "@/service/adminService";
import { DoctorItem } from "@/lib/types";

interface Admin {
  _id: string;
  username: string;
  email: string;
}

interface DashboardData {
  admin: Admin;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
}

interface AdminState {
  admin: Admin | null;
  dashboardData: DashboardData | null;
  doctors: DoctorItem[] | null;
  doctorsMeta: { page: number; limit: number; total: number } | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchDoctors: (page?: number, limit?: number) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
  toggleDoctorStatus: (id: string) => Promise<void>;
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  admin: null,
  doctors: [],
  doctorsMeta: null,
  dashboardData: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      console.log("Returned value:", await adminService.login(email, password));
      const { token } = await adminService.login(email, password);

      localStorage.setItem("token", token);
    } catch (err: any) {
      set({ error: err.message || "Login failed" });
    } finally {
      set({ loading: false });
    }
  },

  fetchDashboard: async () => {
    try {
      set({ loading: true, error: null });
      const data = await adminService.getDashboardData();
      set({ dashboardData: data, admin: data.admin });
    } catch (err: any) {
      set({ error: "Failed to fetch dashboard" });
    } finally {
      set({ loading: false });
    }
  },

  fetchDoctors: async (page = 1) => {
    try {
      set({ loading: true, error: null });
      const response = await adminService.getDoctors(page);
      set({
        doctors: response.doctors,
        doctorsMeta: response.meta,
      });
    } catch (err: any) {
      set({ error: "Failed to fetch doctors" });
    } finally {
      set({ loading: false });
    }
  },
  deleteDoctor: async (id: string) => {
    try {
      set({ loading: true });
      await adminService.deleteDoctor(id);

      // Remove deleted doctor from store
      set((state) => ({
        doctors: state.doctors?.filter((doc) => doc._id !== id) || [],
      }));
    } catch (err: any) {
      set({ error: err.message || "Failed to delete doctor" });
    } finally {
      set({ loading: false });
    }
  },

  toggleDoctorStatus: async (id: string) => {
    try {
      set({ loading: true });
      const updated = await adminService.toggleDoctorStatus(id);
      set((state) => ({
        doctors: state.doctors?.map((doc) =>
          doc._id === id ? { ...doc, isActive: updated.isActive } : doc
        ),
      }));
    } catch (err: any) {
      set({ error: err.message || "Failed to toggle doctor status" });
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ admin: null, dashboardData: null });
  },
}));
