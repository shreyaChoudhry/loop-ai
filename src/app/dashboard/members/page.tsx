import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import InviteMemberButton from "./InviteMemberButton";
function roleStyles(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-violet-100 text-violet-700";

    case "ANALYST":
      return "bg-blue-100 text-blue-700";

    case "VIEWER":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default async function MembersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Only ADMIN can access Members
  if (session.user.role !== "ADMIN") {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
            🔒
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Access Denied
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Only workspace administrators can view and manage members.
          </p>

          <a
            href="/dashboard"
            className="mt-6 inline-flex rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Back to Dashboard
          </a>
        </div>
      </main>
    );
  }

  // Get all users from the current workspace
  const members = await prisma.user.findMany({
    where: {
      workspaceId: session.user.workspaceId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const adminCount = members.filter(
    (member) => member.role === "ADMIN"
  ).length;

  const analystCount = members.filter(
    (member) => member.role === "ANALYST"
  ).length;

  const viewerCount = members.filter(
    (member) => member.role === "VIEWER"
  ).length;

  return (
    <main className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-violet-600">
          WORKSPACE
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Members
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View the people who have access to your LOOP workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
  <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
    {members.length}{" "}
    {members.length === 1 ? "member" : "members"}
  </div>

  <InviteMemberButton />
</div>
        </div>
      </div>

      {/* Role Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {/* Admins */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Admins
            </p>

            <span className="rounded-lg bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
              ADMIN
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-slate-900">
            {adminCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Full workspace access
          </p>
        </div>

        {/* Analysts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Analysts
            </p>

            <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
              ANALYST
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-slate-900">
            {analystCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Analytics and insight access
          </p>
        </div>

        {/* Viewers */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Viewers
            </p>

            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              VIEWER
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-slate-900">
            {viewerCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Read-only workspace access
          </p>
        </div>
      </div>

      {/* Members Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Workspace Members
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Accounts currently associated with this workspace.
          </p>
        </div>

        {/* Empty State */}
        {members.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              👥
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No members found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              There are no users in this workspace yet.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Member
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Role
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      User ID
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      {/* Member */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                            {(member.name || member.email || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {member.name || "Unnamed User"}
                            </p>

                            <p className="truncate text-sm text-slate-500">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${roleStyles(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                      </td>

                      {/* ID */}
                      <td className="max-w-[220px] truncate px-6 py-4 font-mono text-xs text-slate-400">
                        {member.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                      {(member.name || member.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {member.name || "Unnamed User"}
                        </p>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                      </div>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        {member.email}
                      </p>

                      <p className="mt-3 text-xs text-slate-400">
                        Workspace member
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}