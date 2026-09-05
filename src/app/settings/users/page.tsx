import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            Access Denied
          </h1>

          <p className="mt-4 text-gray-600">
            You do not have permission to manage users.
          </p>
        </div> 
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          User Management
        </h1>

        <p className="mt-4">
          Welcome Admin 👋
        </p>
      </div>
    </main>
  );
}