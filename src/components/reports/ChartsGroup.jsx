import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

export default function ChartsGroup({ productionByPlant = [] }) {
  return (
    <div className="lg:col-span-6 h-[500px]">
      <Card className="h-full bg-card border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)] flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-[#06b6d4] text-lg font-bold tracking-wide">
            Total completado agrupado por cliente
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Total completado agrupado por cliente de GP Chile
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 pt-2">
          {productionByPlant.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productionByPlant}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal vertical stroke="#06b6d4" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                  cursor={{ fill: "#06b6d4", opacity: 0.1 }}
                  formatter={(value) => [`${parseInt(value).toLocaleString()} kg`, "Volumen"]}
                />
                <Bar
                  dataKey="value"
                  fill="#06b6d4"
                  radius={[0, 4, 4, 0]}
                  barSize={32}
                  name="Volumen"
                  label={{ position: "right", fill: "#fff", fontSize: 12, formatter: (val) => parseInt(val).toLocaleString() }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">Sin datos para el periodo seleccionado</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
