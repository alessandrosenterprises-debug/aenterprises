import { LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import clsx from "clsx";

export interface StatCardProps {
  title: string;
  value: string | number;

  subtitle?: string;

  icon: LucideIcon;

  trend?: string;

  trendDirection?: "up" | "down" | "neutral";

  color?: "primary" | "gold" | "success" | "warning" | "danger";

  loading?: boolean;

  onClick?: () => void;

  className?: string;
}

const colors = {
  primary: "bg-[#03162F] text-white",
  gold: "bg-[#D4AF37] text-[#03162F]",
  success: "bg-green-500 text-white",
  warning: "bg-yellow-500 text-white",
  danger: "bg-red-500 text-white",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = "neutral",
  color = "primary",
  loading = false,
  onClick,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className="animate-pulse p-6 h-44 rounded-2xl">
        <div className="h-full rounded-xl bg-slate-100" />
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={clsx(
        "cursor-pointer rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="mt-3 text-4xl font-bold">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-2 text-sm text-slate-400">
              {subtitle}
            </p>
          )}

        </div>

        <div
          className={clsx(
            "rounded-xl p-3",
            colors[color]
          )}
        >
          <Icon size={26} />
        </div>

      </div>

      {trend && (
        <div className="mt-6 flex items-center gap-2 text-sm">

          {trendDirection === "up" && (
            <TrendingUp
              size={16}
              className="text-green-600"
            />
          )}

          {trendDirection === "down" && (
            <TrendingDown
              size={16}
              className="text-red-500"
            />
          )}

          {trendDirection === "neutral" && (
            <Minus
              size={16}
              className="text-slate-500"
            />
          )}

          <span>{trend}</span>

        </div>
      )}

    </Card>
  );
}