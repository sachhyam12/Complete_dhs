import ProfilePage from "@/components/ProfilePage/ProfilePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patient Profile | DigitalCare",
  description: "View and manage your doctor profile in DigitalCare platform.",
};

export default function Page() {
  return <ProfilePage userType="patient" />;
}
