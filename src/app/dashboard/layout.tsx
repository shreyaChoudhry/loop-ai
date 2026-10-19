import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
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

  const workspace = session.user.workspaceId
    ? await prisma.workspace.findUnique({
        where: { id: session.user.workspaceId },
        select: { name: true, slug: true },
      })
    : null;

  const feedbackCount = session.user.workspaceId
    ? await prisma.feedback.count({
        where: { workspaceId: session.user.workspaceId },
      })
    : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar
        user={session.user}
        workspaceName={workspace?.name || "Acme SaaS"}
        workspaceSlug={workspace?.slug || "acme-demo"}
        feedbackCount={feedbackCount}
      />

      <div className="ml-0 pt-16 md:ml-64 md:pt-0 min-h-screen flex flex-col">
        <Topbar
          user={session.user}
          workspaceSlug={workspace?.slug || "acme-demo"}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}