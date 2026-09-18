import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={session.user.role} />

      <div className="ml-0 pt-16 md:ml-64 md:pt-0">
        <Topbar />

        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}