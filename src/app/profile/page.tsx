import type { Metadata } from "next";
import { ProfileGate } from "@/components/ProfileGate";

export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false },
};

export default function ProfilePage() {
  return (
    <main className="profile-page mx-auto max-w-wrap px-5 py-10 md:px-16 md:py-14">
      <ProfileGate />
    </main>
  );
}
