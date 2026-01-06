import React from "react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const InterannualComparisonChart = ({ data = [], yearA, yearB }) => {
  const hasData = Array.isArray(data) && data.length > 0;
  if (!hasData) return <div className="h-64 flex items-center justify-center text-muted-foreground">Sin datos comparativos</div>;

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis />
        <Tooltip />
        <Bar dataKey={`volume_${yearA}`} name={String(yearA)} fill="#60A5FA" />
        <Bar dataKey={`volume_${yearB}`} name={String(yearB)} fill="#34D399" />
        <Line type="monotone" dataKey={`diff_${yearB}_${yearA}`} stroke="#F97316" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default React.memo(InterannualComparisonChart);
