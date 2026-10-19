type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  trend?: string;
  trendPositive?: boolean;
};

export default function StatCard({
  title,
  value,
  description,
  trend,
  trendPositive = true,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {trend && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
              trendPositive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        {value}
      </div>

      {description && (
        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}