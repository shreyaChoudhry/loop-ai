import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findUnique({
    where: {
      id: session.user.workspaceId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!workspace) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-900"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your workspace, account and application preferences.
          </p>
        </div>

        <div className="space-y-6">
          {/* Workspace */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Workspace
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Basic information about your LOOP workspace.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Workspace Name
                </label>

                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900">
                  {workspace.name}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Workspace ID
                </label>

                <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {workspace.id}
                </div>
              </div>
            </div>
          </section>

          {/* Account */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Account
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Information about your current LOOP account.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Name
                </label>

                <div className="mt-2 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900">
                  {session.user.name || "Not provided"}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Email
                </label>

                <div className="mt-2 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900">
                  {session.user.email || "Not provided"}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Role
                </label>

                <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                  {session.user.role}
                </div>
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Appearance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Customize how LOOP looks for you.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Interface theme
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Light theme is currently active.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                Light
              </span>
            </div>
          </section>

          {/* Notifications */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Notifications
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage future notification preferences.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Report notifications
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Receive updates when reports are generated.
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                  Coming soon
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    AI processing alerts
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Get notified about important processing events.
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                  Coming soon
                </span>
              </div>
            </div>
          </section>

          {/* Integrations */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Integrations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                External data sources connected to LOOP.
              </p>
            </div>

            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm font-medium text-slate-700">
                No external integrations connected
              </p>

              <p className="mt-1 text-xs text-slate-500">
                CSV import and simulated channels are currently available.
              </p>
            </div>
          </section>

          {/* Members */}
          {session.user.role === "ADMIN" && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Team Members
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage users and workspace access.
                  </p>
                </div>

                <Link
                  href="/settings/users"
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Manage Members
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}