import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import SidebarNav from "./SidebarNav";

export default async function Sidebar() {
  const session = await getServerSession(authOptions);

  const role = session?.user?.role;

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-[#0b1026] px-4 py-5 text-white">
      
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-sm font-bold">
          ◉
        </div>

        <span className="text-xl font-bold tracking-wide">
          LOOP
        </span>
      </div>

      {/* Workspace */}
      <div className="mb-6 rounded-lg bg-white/10 px-3 py-3">
        <p className="text-xs text-gray-400">
          WORKSPACE
        </p>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm font-medium">
            Acme Inc.
          </span>

          <span className="text-xs text-gray-400">
            ▼
          </span>
        </div>
      </div>

      {/* Navigation */}
      <SidebarNav role={role} />

      {/* Bottom */}
      <div className="border-t border-white/10 pt-4">
        <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-400 hover:bg-white/10 hover:text-white">
          ? &nbsp; Help & Support
        </button>
      </div>
    </aside>
  );
}