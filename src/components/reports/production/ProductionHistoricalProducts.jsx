import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * Props esperadas:
 * - records: production_records (ya filtrados o crudos)
 * - availableYears: array de años
 */
export default function ProductionHistoricalProducts({ availableYears = [] }) {
  /* =========================
       CONTROLES LOCALES
    ========================== */
  const [year, setYear] = useState("all");

  const [historicalData, setHistoricalData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [productClients, setProductClients] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      /* =====================
               PRODUCCIÓN HISTÓRICA
            ====================== */
      let histQuery = supabase
        .from("vw_production_historical")
        .select("*")
        .order("year")
        .order("month");

      if (year !== "all") {
        histQuery = histQuery.eq("year", year);
      }

      const { data: hist } = await histQuery;

      setHistoricalData(
        hist?.map((r) => ({
          name: `${r.year}-${String(r.month).padStart(2, "0")}`,
          value: r.total_kg,
        })) ?? [],
      );

      /* =====================
               TOP 10 PRODUCTOS
            ====================== */
      let topQuery = supabase
        .from("vw_production_top_products")
        .select("*")
        .order("total_kg", { ascending: false })
        .limit(10);

      if (year !== "all") {
        topQuery = topQuery.eq("year", year);
      }

      const { data: products } = await topQuery;
      setTopProducts(products ?? []);

      /* =====================
               CLIENTES POR PRODUCTO
            ====================== */
      const { data: clients } = await supabase
        .from("vw_product_clients")
        .select("*");

      setProductClients(clients ?? []);
    };

    fetchData();
  }, [year]);

  /* =========================
       FILTRO BASE
    ========================== */
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (year === "all") return true;
      const d = new Date(r.Fecha);
      return d.getFullYear().toString() === year;
    });
  }, [records, year]);

  const totalProduction = useMemo(() => {
    return historicalData.reduce((acc, r) => acc + r.value, 0);
  }, [historicalData]);

  const topProduct = topProducts[0];

  /* =========================
       PIE DATA (TOP VS TOTAL)
    ========================== */
  const pieData = useMemo(() => {
    if (!topProduct) return [];
    return [
      { name: "Top producto", value: topProduct.total_kg },
      {
        name: "Resto",
        value: totalProduction - topProduct.total_kg,
      },
    ];
  }, [topProduct, totalProduction]);

  /* =========================
       CLIENTE TOP DEL PRODUCTO
    ========================== */
  const topProductClient = useMemo(() => {
    if (!topProduct) return null;

    const map = {};

    filteredRecords.forEach((r) => {
      if (r.Descripcion === topProduct.producto) {
        map[r.Cliente] = (map[r.Cliente] || 0) + (r.Completado || 0);
      }
    });

    return Object.entries(map)
      .map(([client, volume]) => ({ client, volume }))
      .sort((a, b) => b.volume - a.volume)[0];
  }, [filteredRecords, topProduct]);

  const clientSharePercent = useMemo(() => {
    if (!topProductClient || totalProduction === 0) return null;
    return ((topProductClient.volume / totalProduction) * 100).toFixed(1);
  }, [topProductClient, totalProduction]);

  /* =========================
       RENDER
    ========================== */
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* CONTROLES */}
      <div className="lg:col-span-2 min-h-[420px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="all">Todos los años</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>

      {/* CENTRO */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* HISTÓRICO */}
        <Card className="h-[300px]">
          <CardHeader>
            <CardTitle>Producción histórica</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* TOP 10 */}
        <Card className="h-[280px]">
          <CardHeader>
            <CardTitle>Top 10 productos más vendidos</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ left: 80 }}
              >
                <XAxis type="number" />
                <YAxis dataKey="producto" type="category" width={200} />
                <Tooltip />
                <Bar dataKey="total_kg" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* DERECHA */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        {/* PIE */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Producto líder vs total</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#e5e7eb" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CLIENTE */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Cliente principal del producto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProductClient ? (
              <>
                <p className="font-bold">{topProductClient.client}</p>
                <p className="text-xs text-muted-foreground">
                  {topProductClient.volume.toLocaleString()} kg
                </p>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Sin datos</span>
            )}
          </CardContent>
        </Card>

        {/* PESO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Peso del cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {clientSharePercent ? (
              <span className="text-3xl font-extrabold text-indigo-500">
                {clientSharePercent}%
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                No calculable
              </span>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
