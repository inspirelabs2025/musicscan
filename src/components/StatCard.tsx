import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export const StatCard = ({ title, value, subtitle, icon: Icon, trend }: StatCardProps) => {
  return (
    <Card variant="purple" className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-purple-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-card-purple-foreground/70" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-purple-foreground">{value}</div>
        {subtitle && (
          <p className="text-xs text-card-purple-foreground/70 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};