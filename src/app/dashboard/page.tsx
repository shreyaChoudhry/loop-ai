import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          LOOP Dashboard
        </h1>

        <p className="mt-4 text-xl">
          Welcome, {session.user.name} 👋
        </p>

        <p className="mt-2 text-gray-600">
          You are logged in.
        </p>

        <p className="mt-2 text-gray-600">
          Role: {session.user.role}
        </p>
    <LogoutButton />
      </div>
    </main>
  );
}