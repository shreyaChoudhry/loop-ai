export default function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      
      {/* Search */}
      <div className="w-96">
        <input
          type="text"
          placeholder="Search feedback, themes, reports..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-violet-500"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">

        {/* Upgrade */}
        <button className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50">
          Upgrade
        </button>

        {/* Notifications */}
        <button className="text-lg">
          🔔
        </button>

        <button className="text-lg">
          🔔
        </button>

        {/* User */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
          S
        </div>

      </div>
    </header>
  );
}