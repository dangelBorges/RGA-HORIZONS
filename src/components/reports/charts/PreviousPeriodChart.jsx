import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const PreviousPeriodChart = ({ data = [] }) => {
  const hasData = Array.isArray(data) && data.length > 0;
  if (!hasData) return <div className="h-full flex items-center justify-center text-muted-foreground">Sin datos</div>;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default React.memo(PreviousPeriodChart);
