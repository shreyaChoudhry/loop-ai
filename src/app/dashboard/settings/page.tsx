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
      slug: true,
    },
  });

  if (!workspace) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Settings & Configurations
          </h1>
          <span className="rounded-full bg-purple-100 border border-purple-200/80 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
            Workspace Hub
          </span>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Manage workspace settings, public portal branding, API keys, and notification preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Workspace Info */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Workspace Environment
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Current active database workspace and identifiers.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <span className="font-semibold text-slate-500 block mb-1">Workspace Name</span>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-bold text-slate-900">
                {workspace.name}
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-500 block mb-1">Database Workspace ID</span>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-slate-600 truncate">
                {workspace.id}
              </div>
            </div>
          </div>
        </section>

        {/* Account Info */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            User Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Profile and permissions for your authenticated session.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs">
            <div>
              <span className="font-semibold text-slate-500 block mb-1">Name</span>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 font-medium">
                {session.user.name || "Alex Rivera"}
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-500 block mb-1">Email</span>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 font-medium truncate">
                {session.user.email}
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-500 block mb-1">Role Permission</span>
              <div className="rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2.5 text-purple-700 font-bold uppercase">
                {session.user.role}
              </div>
            </div>
          </div>
        </section>

        {/* Public Feedback Portal & Weekly Digest */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Public Feedback Portal & Weekly Digest
              </h2>
              <p className="mt-1 text-xs text-slate-500 max-w-xl">
                Configure your customer-facing feedback board, public URL slug, custom branding, and weekly founder digest email schedule.
              </p>
            </div>

            <Link
              href="/dashboard/settings/portal"
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 transition shadow-sm shrink-0"
            >
              <span>Configure Portal & Digest</span>
              <span>→</span>
            </Link>
          </div>
        </section>

        {/* Integrations & Webhooks */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Integrations, Webhooks & Widget
              </h2>
              <p className="mt-1 text-xs text-slate-500 max-w-xl">
                Generate workspace API keys, ingest incoming webhook payloads from external systems, and embed customer feedback widgets.
              </p>
            </div>

            <Link
              href="/dashboard/settings/integrations"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm shrink-0"
            >
              <span>Manage Integrations</span>
              <span>→</span>
            </Link>
          </div>
        </section>

        {/* Team Members */}
        {session.user.role === "ADMIN" && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Team Members & Permissions
                </h2>
                <p className="mt-1 text-xs text-slate-500 max-w-xl">
                  Invite teammates to collaborate with Admin, Analyst, or Viewer roles.
                </p>
              </div>

              <Link
                href="/dashboard/members"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-black px-4 py-2 text-xs font-bold text-white transition shadow-sm shrink-0"
              >
                <span>Manage Team Members</span>
                <span>→</span>
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}