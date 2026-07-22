import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { Card } from "./Card";

interface KPIProps {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  positive?: boolean;
}

export function KPI({ label, value, delta, icon: Icon, positive = true }: KPIProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
          <Icon size={15} strokeWidth={2} />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
      {delta && (
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            positive ? "text-green-500" : "text-red-500"
          }`}
        >
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {delta}
        </div>
      )}
    </Card>
  );
}
