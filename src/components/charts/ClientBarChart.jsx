import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";

export default function ClientBarChart({
    data,
    valueKey,
    valueLabel = "Volumen",
    barColor = "#6366f1", // nuevo
}) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 640px)");
        const handler = () => setIsMobile(mq.matches);
        handler();
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    if (!data || data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                Sin datos
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                layout="vertical"
                margin={{
                    top: 10,
                    right: 20,
                    left: isMobile ? 70 : 140,
                    bottom: 10,
                }}
            >
                <XAxis type="number" />
                <YAxis
                    type="category"
                    dataKey="client"
                    width={160}
                    tick={{ fontSize: 12 }}
                    interval={0}
                />

                <Tooltip
                    formatter={(value, name, props) => {
                        if (props.payload?.diffPercent !== undefined) {
                            const sign = props.payload.diffPercent >= 0 ? "+" : "";
                            return [
                                `${Number(value).toLocaleString()} kg`,
                                `${sign}${props.payload.diffPercent.toFixed(1)}%`,
                            ];
                        }

                        return `${Number(value).toLocaleString()} kg`;
                    }}
                    labelFormatter={(label) => `Cliente: ${label}`}
                />

                <Bar
                    dataKey={valueKey}
                    fill={barColor}
                    radius={[0, 6, 6, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
