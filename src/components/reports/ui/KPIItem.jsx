import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const KPIItem = ({ kpi = {} }) => {
  const { label = "KPI", value = 0, change = 0, color = "text-foreground" } = kpi;
  return (
    <Card className="mb-3 bg-card border-border">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={`text-lg font-bold ${color}`}>{value}</div>
          </div>
          <div className="text-sm text-muted-foreground">{change >= 0 ? `+${change}%` : `${change}%`}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(KPIItem);
