import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const HistoricalProductionChart = ({ data = [] }) => {
  const hasData = Array.isArray(data) && data.length > 0;
  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">Sin datos históricos</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="volume_kilos" stroke="#06b6d4" fillOpacity={1} fill="url(#colorProd)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default React.memo(HistoricalProductionChart);
