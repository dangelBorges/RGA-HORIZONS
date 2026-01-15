import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const TopProductsChart = ({ data = [], hasData = true }) => {
  const items = Array.isArray(data) && data.length > 0 ? data : [];

  if (!hasData || items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Sin datos de productos
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={items} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number"
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false} />
        <YAxis dataKey="product" type="category" width={200}
          tick={{
            fill: "#475569",
            fontSize: 10,
            fontWeight: 500,
          }}
          axisLine={false}
          tickLine={false} />
        <Tooltip />
        <Bar dataKey="volume_kilos" fill="#6366F1" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default React.memo(TopProductsChart);
