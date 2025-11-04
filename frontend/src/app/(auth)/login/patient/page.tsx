import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: "Patient Login - DigitalCare",
  description:
    "Sign in to your DigitalCare account to access healthcare consultations.",
};

export default function PatientLoginPage() {
  return <AuthForm type="login" userRole="patient" />;
}
