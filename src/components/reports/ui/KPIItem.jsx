import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const KPIItem = ({ kpi = {} }) => (
    <Card className="h-full bg-card border-cyan-500/20 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
        <CardHeader className="pb-2">
            <CardTitle className="text-cyan-400 font-bold uppercase tracking-wider text-sm">
                {kpi.label}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="mt-2">
                <span className="text-4xl lg:text-5xl font-extrabold text-blue-700 tracking-tight">
                    {parseFloat(kpi.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <div className="text-xl font-bold text-slate-500 mt-1">{kpi.unit?.toUpperCase()}</div>
            </div>
            {kpi.subtext && (
                <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">{kpi.subtext}</p>
            )}
        </CardContent>
    </Card>
);

export default React.memo(KPIItem);
