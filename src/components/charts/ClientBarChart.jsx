import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function ClientBarChart({
    data,
    valueKey,
    valueLabel = "Volumen",
}) {
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
                margin={{ top: 10, right: 20, left: 80, bottom: 10 }}
            >
                <XAxis type="number" />
                <YAxis type="category" dataKey="client" />
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

                <Bar dataKey={valueKey} fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
