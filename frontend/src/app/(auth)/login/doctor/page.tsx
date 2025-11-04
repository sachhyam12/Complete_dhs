import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: "Doctor Login - DigitalCare",
  description:
    "Healthcare provider sign in to DigitalCare platform. Manage your practice and consultations.",
};

export default function DoctorLoginPage() {
  return <AuthForm type="login" userRole="doctor" />;
}
