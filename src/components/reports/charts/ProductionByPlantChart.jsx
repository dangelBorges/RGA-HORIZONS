import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const ProductionByPlantChart = ({ data = [] }) => {
  const hasData = Array.isArray(data) && data.length > 0;

  if (!hasData) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Sin datos para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="plant" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="volume_kilos" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default React.memo(ProductionByPlantChart);
