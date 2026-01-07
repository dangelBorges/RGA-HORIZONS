import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRawMaterials } from "@/hooks/useRawMaterials";

const COLORS = "#10b981";

const TopRawMaterialsChart = ({ year, month }) => {
    const { data, loading } = useRawMaterials({ year, month });

    return (
        <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wider text-emerald-400">
                    Materia prima más consumida
                </CardTitle>
            </CardHeader>

            <CardContent className="h-[320px]">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        Cargando datos...
                    </div>
                ) : data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal
                                vertical={false}
                                opacity={0.2}
                            />

                            <XAxis
                                type="number"
                                tick={{ fill: "#475569", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />

                            <YAxis
                                type="category"
                                dataKey="material_name"
                                width={200}
                                tick={{
                                    fill: "#0f172a",
                                    fontSize: 12,
                                    fontWeight: 500,
                                }}
                                axisLine={false}
                                tickLine={false}
                            />

                            <Tooltip
                                formatter={(v) => [
                                    `${Number(v).toLocaleString()} kg`,
                                    "Consumo",
                                ]}
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                }}
                            />

                            <Bar
                                dataKey="total_kg"
                                fill={COLORS}
                                radius={[0, 6, 6, 0]}
                                barSize={26}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        Sin datos de consumo
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TopRawMaterialsChart;
