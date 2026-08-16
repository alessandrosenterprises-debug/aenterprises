"use client";

import {
  Building2,
  Users,
  Briefcase,
  CalendarDays,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import clsx from "clsx";

import { Card } from "@/components/ui/card/index";

export type StatIcon =
  | "building"
  | "users"
  | "briefcase"
  | "calendar"
  | "money";

export interface StatCardProps {
  title: string;
  value: string | number;

  subtitle?: string;

  icon: StatIcon;

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

const iconMap = {
  building: Building2,
  users: Users,
  briefcase: Briefcase,
  calendar: CalendarDays,
  money: DollarSign,
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendDirection = "neutral",
  color = "primary",
  loading = false,
  onClick,
  className,
}: StatCardProps) {
  const Icon = iconMap[icon];

  if (loading) {
    return (
      <Card
        className={clsx(
          "h-44 animate-pulse rounded-2xl p-6",
          className
        )}
      >
        <div className="h-full rounded-xl bg-slate-100" />
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={clsx(
        "rounded-2xl p-6 transition-all duration-200",
        onClick &&
          "cursor-pointer hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="mt-3 text-4xl font-bold text-[#03162F]">
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

          <span className="text-slate-600">
            {trend}
          </span>
        </div>
      )}
    </Card>
  );
}