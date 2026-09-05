import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Left Sidebar */}
      <Sidebar />

      {/* Right side */}
      <div className="ml-64">
        
        {/* Top Navbar */}
        <Topbar />

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>

      </div>
    </div>
  );
}