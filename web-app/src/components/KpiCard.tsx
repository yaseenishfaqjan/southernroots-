import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  color?: "green" | "blue" | "orange" | "red" | "purple";
}

const colorMap = {
  green: "bg-green-50 text-green-600",
  blue: "bg-blue-50 text-blue-600",
  orange: "bg-orange-50 text-orange-600",
  red: "bg-red-50 text-red-600",
  purple: "bg-purple-50 text-purple-600",
};

export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "green",
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 sm:p-3 rounded-lg flex-shrink-0 ${colorMap[color]}`}>{icon}</div>
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 mt-3 text-sm ${
            trend === "up"
              ? "text-green-600"
              : trend === "down"
              ? "text-red-500"
              : "text-gray-400"
          }`}
        >
          {trend === "up" && <TrendingUp className="w-3 h-3" />}
          {trend === "down" && <TrendingDown className="w-3 h-3" />}
        </div>
      )}
    </div>
  );
}
