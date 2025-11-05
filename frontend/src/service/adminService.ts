import {
  getWithAuth,
  postWithoutAuth,
  postWithAuth,
  deleteWithAuth,
} from "@/service/httpService";
import { DoctorItem } from "@/lib/types";

interface LoginData {
  token: string;
}

interface DashboardData {
  admin: {
    _id: string;
    username: string;
    email: string;
  };
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
}

interface DoctorsListData {
  doctors: DoctorItem[];
  meta: { page: number; limit: number; total: number };
}

export const adminService = {
  register: async (
    username: string,
    email: string,
    password: string,
    adminKey: string
  ) => {
    const response = await postWithoutAuth("/admin/register", {
      username,
      email,
      password,
      adminKey,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await postWithoutAuth<LoginData>("/admin/login", {
      email,
      password,
    });

    const token = response.data?.token;
    if (!token) {
      throw new Error("Login failed: token missing in response");
    }

    localStorage.setItem("token", token);
    return { token };
  },

  getDashboardData: async () => {
    const response = await getWithAuth<DashboardData>("/admin/dashboard");
    return response.data;
  },

  getDoctors: async (page = 1, limit = 20): Promise<DoctorsListData> => {
    const response = await getWithAuth<{ doctors: DoctorItem[]; meta: any }>(
      `/admin/doctors?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  addDoctor: async (doctorData: {
    name: string;
    email: string;
    password: string;
    specialization?: string;
  }) => {
    const response = await postWithAuth<{ data: DoctorItem }>(
      "/admin/add-doctor",
      doctorData
    );
    return response.data;
  },

  async deleteDoctor(id: string) {
    return await deleteWithAuth(`/admin/delete-doctor/${id}`);
  },
  toggleDoctorStatus: async (id: string) => {
    const response = await postWithAuth(`/admin/toggle-doctor/${id}`, {});
    return response.data;
  },
};
