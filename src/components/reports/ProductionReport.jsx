import React, { useState, useMemo, useEffect } from "react";

// Librerías de visualización
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Legend,
  Line,
} from "recharts";

// Iconografía
import {
  Factory,
  FileText,
  History,
  Users,
  CheckCircle2,
  Briefcase,
  Plane,
  XCircle,
  Activity,
  Target,
  AlertTriangle,
} from "lucide-react";

// Componentes internos
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ProductionReportLayout from "@/components/reports/ProductionReportLayout";
import ProductionTrajectory from "@/components/reports/ProductionTrajectory";
import TopRawMaterialsChart from "@/components/reports/production/TopRawMaterialsChart";
import ProductionFilters from "@/components/ProductionFilters";
import ClientBarChart from "@/components/charts/ClientBarChart";
import KPIItem from "@/components/reports/ui/KPIItem";
import ClientRankItem from "@/components/reports/ui/ClientRankItem";
import ExecutiveSummary from "@/components/reports/ui/ExecutiveSummary";

// Hooks
import { useProductionReports } from "@/hooks/useReports";
import { useInterannualComparison } from '@/hooks/useInterannualComparison';


// --------------------------------------------------
// Comentarios (en español):
// Este componente `ProductionReport` compone múltiples bloques:
// - Importaciones y constantes de mapeo
// - Helpers seguros para acceder a campos en registros
// - Hooks y useMemo para calcular KPIs y series de datos
// - Renderizado principal con múltiples secciones/tarjetas y gráficos
// A continuación se documentan los bloques principales en español.
// --------------------------------------------------

// Mapa de traducción simple usado para etiquetas mostradas en UI
const TRANSLATION_MAP = {
  "producción total": "Producción Total",
  "enviado a los inplants": "Enviado a las Plantas Cliente",
};

// Mapeo estático de códigos de cliente a nombres legibles
const CLIENT_MAPPING = {
  C0010: "CMPC Osorno",
  C0005: "Chilempack",
  C0029: "Chilempack",
  C0031: "CMPC Osorno",
  C0049: "CMPC Buin Norte",
  C0059: "CMPC Buin Sur",
  C0052: "Til Til",
};

// Helpers para obtener valores numéricos/strings de un registro
// Intentan varias variantes de nombre de campo y devuelven valor por defecto seguro
const getVal = (r = {}, key) =>
  r?.[key] ?? r?.[key.charAt(0).toUpperCase() + key.slice(1)] ?? 0;
const getStr = (r = {}, key) => {
  if (!r) return "";
  return r?.[key] ?? r?.[key.charAt(0).toUpperCase() + key.slice(1)] ?? "";
};

// Traduce textos usando TRANSLATION_MAP, si existe
const translateText = (key) => TRANSLATION_MAP[key?.toLowerCase()] || key;

// Resuelve nombre de cliente a partir de varios campos posibles y del mapeo
const resolveClientName = (r = {}) => {
  const code =
    r["CveCliente"] || r["cvecliente"] || r["cveCliente"] || r["CVE_CLIENTE"];
  if (code) {
    const cleanCode = String(code).trim();
    if (CLIENT_MAPPING[cleanCode]) return CLIENT_MAPPING[cleanCode];
  }
  const rawName = getStr(r, "cliente");
  return rawName || "Sin Cliente";
};

// Subcomponents extracted to `src/components/reports/ui` to keep file smaller

// Componente principal del reporte de producción
const ProductionReport = () => {
  const {
    productionRecords = [],
    kpis: initialKpis = [],
    plantsMapData,
    topProducts = [],
    loading,
  } = useProductionReports();

  // Debugging outputs to inspect data during development
  try {
    console.debug("[ProductionReport] productionRecords:", productionRecords?.length);
  } catch (e) {}

  // ---------------------------
  // ---------------------------
  // Estado y control de filtros visibles en UI (año, mes, rango de fechas)
  const [filters, setFilters] = useState({
    year: "all",
    month: "all",
    dateFrom: "",
    dateTo: "",
  });
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // ---------------------------
  // ---------------------------
  // Filtros adicionales usados para vistas históricas (cliente, año, mes)
  const [historicalFilters, setHistoricalFilters] = useState({
    year: "all",
    month: "all",
    client: "all",
  });

  // Calcula los años disponibles a partir de los registros de producción
  const availableYears = useMemo(() => {
    const setYears = new Set();
    productionRecords.forEach((r) => {
      const dStr = getStr(r, "fecha");
      if (!dStr) return;
      const d = new Date(dStr);
      if (!isNaN(d.getTime())) setYears.add(String(d.getFullYear()));
    });
    return Array.from(setYears).sort((a, b) => b - a);
  }, [productionRecords]);
  const [topN, setTopN] = useState(10);

  // Estados para comparación interanual (A vs B)
  const [compareYearA, setCompareYearA] = useState(
    availableYears[availableYears.length - 2] || "",
  );
  const [compareYearB, setCompareYearB] = useState(
    availableYears[availableYears.length - 1] || "",
  );

  // Ensure compare years are set once availableYears are computed
  useEffect(() => {
    if (availableYears && availableYears.length > 1) {
      setCompareYearA((prev) => prev || availableYears[availableYears.length - 2] || availableYears[0]);
      setCompareYearB((prev) => prev || availableYears[availableYears.length - 1] || availableYears[0]);
    }
  }, [availableYears]);

  // Visibility toggles for interannual comparison series and dots
  const [visibleSeries, setVisibleSeries] = useState({});
  const [showDots, setShowDots] = useState(true);

  useEffect(() => {
    // initialize visibility for current compare years
    if (compareYearA || compareYearB) {
      setVisibleSeries((prev) => ({
        ...(prev || {}),
        [compareYearA]: prev[compareYearA] ?? true,
        [compareYearB]: prev[compareYearB] ?? true,
      }));
    }
  }, [compareYearA, compareYearB]);

  // Busca la fecha máxima en los registros y actualiza filtros iniciales
  useEffect(() => {
    if (
      !loading &&
      productionRecords &&
      productionRecords.length > 0 &&
      !filtersInitialized
    ) {
      let maxDate = null;
      productionRecords.forEach((r) => {
        const dStr = getStr(r, "fecha");
        if (!dStr) return;
        const d = new Date(dStr);
        if (!isNaN(d.getTime())) {
          if (!maxDate || d > maxDate) maxDate = d;
        }
      });
      if (maxDate) {
        setFilters((prev) => ({
          ...prev,
          year: String(maxDate.getFullYear()),
          month: String(maxDate.getMonth()),
        }));
        setFiltersInitialized(true);
      }
    }
  }, [loading, productionRecords, filtersInitialized]);

  // Estado para la sección de analítica por cliente
  const [clientAnalyticsYear, setClientAnalyticsYear] = useState("all");

  const clientAnalyticsYears = availableYears;
  const selectedYear = clientAnalyticsYear;
  const previousYears =
    selectedYear === "all"
      ? []
      : availableYears.filter((y) => y < selectedYear);

  // Filtra `productionRecords` según `filters` seleccionadas
  const filteredRecords = useMemo(() => {
    if (!productionRecords) return [];
    return productionRecords.filter((record) => {
      const dateStr = getStr(record, "fecha");
      if (!dateStr) return false;
      const recordDate = new Date(dateStr);
      if (isNaN(recordDate.getTime())) return false;

      if (
        filters.year !== "all" &&
        String(recordDate.getFullYear()) !== filters.year
      )
        return false;
      if (
        filters.month !== "all" &&
        String(recordDate.getMonth()) !== filters.month
      )
        return false;
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        from.setHours(0, 0, 0, 0);
        if (recordDate < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (recordDate > to) return false;
      }
      return true;
    });
  }, [productionRecords, filters]);

  // Agrupa y totaliza producción por mes para los 3 meses anteriores
  const previousPeriodData = useMemo(() => {
    if (!productionRecords || productionRecords.length === 0) return [];
    let anchorDate = new Date();
    if (filters.dateFrom) {
      anchorDate = new Date(filters.dateFrom);
      anchorDate.setHours(0, 0, 0, 0);
    } else {
      const currentYear = new Date().getFullYear();
      const y = filters.year !== "all" ? parseInt(filters.year) : currentYear;
      const m = filters.month !== "all" ? parseInt(filters.month) : 0;
      anchorDate = new Date(y, m, 1);
    }
    const endDate = new Date(anchorDate);
    const startDate = new Date(anchorDate);
    startDate.setMonth(startDate.getMonth() - 3);

    const pastRecords = productionRecords.filter((r) => {
      const dStr = getStr(r, "fecha");
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= startDate && d < endDate;
    });

    const grouped = {};
    for (
      let d = new Date(startDate);
      d < endDate;
      d.setMonth(d.getMonth() + 1)
    ) {
      const sortKey = d.toISOString().slice(0, 7);
      const label = d.toLocaleString("es-CL", { month: "short" });
      grouped[sortKey] = {
        name: label.charAt(0).toUpperCase() + label.slice(1),
        sortKey,
        value: 0,
      };
    }
    pastRecords.forEach((r) => {
      const d = new Date(getStr(r, "fecha"));
      const sortKey = d.toISOString().slice(0, 7);
      if (grouped[sortKey]) {
        const val =
          Number(getVal(r, "completado")) ||
          Number(getVal(r, "completado real")) ||
          0;
        grouped[sortKey].value += val;
      }
    });
    return Object.values(grouped).sort((a, b) =>
      a.sortKey.localeCompare(b.sortKey),
    );
  }, [productionRecords, filters]);

  // Calcula KPIs dinámicos basados en `filteredRecords` (p.ej. Producción Total)
  const dynamicKPIs = useMemo(() => {
    const totalCompleted = filteredRecords.reduce(
      (acc, r) =>
        acc +
        (Number(getVal(r, "completado")) ||
          Number(getVal(r, "completado real")) ||
          0),
      0,
    );
    if (!productionRecords || productionRecords.length === 0)
      return initialKpis || [];
    return [
      {
        id: "k1",
        label: translateText("Producción Total"),
        value: totalCompleted,
        unit: "kg",
        trend_up: true,
        subtext: translateText("Enviado a las Plantas Cliente"),
      },
    ];
  }, [filteredRecords, initialKpis, productionRecords]);

  // Agrupa producción por cliente/plant para mostrar en gráfico
  const productionByPlant = useMemo(() => {
    const grouped = {};
    filteredRecords.forEach((r) => {
      const name = resolveClientName(r);
      const val =
        Number(getVal(r, "completado")) ||
        Number(getVal(r, "completado real")) ||
        0;
      grouped[name] = (grouped[name] || 0) + val;
    });
    return Object.keys(grouped)
      .map((k) => ({ name: k, value: grouped[k] }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords]);

  // Calcula clientes principales por volumen en el periodo filtrado
  const productionByClient = useMemo(() => {
    const grouped = {};
    filteredRecords.forEach((r) => {
      const client = resolveClientName(r);
      const val =
        Number(getVal(r, "completado")) ||
        Number(getVal(r, "completado real")) ||
        0;
      grouped[client] = (grouped[client] || 0) + val;
    });
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, vol], i) => ({
        id: name,
        rank: i + 1,
        client_name: name,
        volume_kilos: vol,
      }));
  }, [filteredRecords]);

  // Productos principales filtrados por periodo
  const topProductsFiltered = useMemo(() => {
    const grouped = {};

    filteredRecords.forEach((r) => {
      const product = getStr(r, "Descripcion") || "Sin producto";
      const value =
        Number(getVal(r, "completado")) ||
        Number(getVal(r, "completado real")) ||
        0;

      grouped[product] = (grouped[product] || 0) + value;
    });

    return Object.entries(grouped)
      .map(([producto, total_kg]) => ({ producto, total_kg }))
      .sort((a, b) => b.total_kg - a.total_kg)
      .slice(0, 10); // 10 principales (ajustable)
  }, [filteredRecords]);

  // Agrupa por Descripción (artículo) y toma 8 principales
  const productionByArticle = useMemo(() => {
    const grouped = {};
    filteredRecords.forEach((r) => {
      const art = getStr(r, "Descripcion") || "Varios";
      const val =
        Number(getVal(r, "completado")) ||
        Number(getVal(r, "completado real")) ||
        0;
      grouped[art] = (grouped[art] || 0) + val;
    });
    return Object.keys(grouped)
      .map((k) => ({ name: k, value: grouped[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredRecords]);

  // Extrae todos los clientes únicos para los selectores
  const availableClients = useMemo(() => {
    const set = new Set();
    productionRecords.forEach((r) => {
      set.add(resolveClientName(r));
    });
    return Array.from(set).sort();
  }, [productionRecords]);

  // Filtra registros para vistas históricas (historicalFilters)
  const historicalFilteredRecords = useMemo(() => {
    return productionRecords.filter((r) => {
      const dateStr = getStr(r, "fecha");
      if (!dateStr) return false;

      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;

      if (
        historicalFilters.year !== "all" &&
        String(d.getFullYear()) !== historicalFilters.year
      )
        return false;

      if (
        historicalFilters.month !== "all" &&
        String(d.getMonth()) !== historicalFilters.month
      )
        return false;

      if (
        historicalFilters.client !== "all" &&
        resolveClientName(r) !== historicalFilters.client
      )
        return false;

      return true;
    });
  }, [productionRecords, historicalFilters]);

  // Genera serie temporal mensual para producción histórica
  const historicalDensityData = useMemo(() => {
    const grouped = {};

    historicalFilteredRecords.forEach((r) => {
      const d = new Date(getStr(r, "fecha"));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const val =
        Number(getVal(r, "completado")) ||
        Number(getVal(r, "completado real")) ||
        0;

      grouped[key] = (grouped[key] || 0) + val;
    });

    return Object.entries(grouped)
      .map(([period, total]) => ({ period, total }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [historicalFilteredRecords]);

  // Compara dos años mes a mes (A vs B)
  const interannualComparison = useInterannualComparison({
    records: productionRecords,
    yearA: compareYearA,
    yearB: compareYearB,
    getVal,
  });

  try {
    console.debug("[ProductionReport] interannualComparison sample:", interannualComparison?.slice?.(0, 3));
  } catch (e) {}




  // Valores auxiliares derivados de KPIs y registros filtrados
  const totalProductionVal =
    dynamicKPIs.find((k) => k.label === "Producción Total")?.value || 0;
  const totalPlannedForEfficiency = filteredRecords.reduce(
    (acc, r) =>
      acc +
      (Number(getVal(r, "planificado")) ||
        Number(getVal(r, "planificado real")) ||
        0),
    0,
  );
  const totalCompletedForEfficiency = filteredRecords.reduce(
    (acc, r) =>
      acc +
      (Number(getVal(r, "completado")) ||
        Number(getVal(r, "completado real")) ||
        0),
    0,
  );
  const efficiencyVal =
    totalPlannedForEfficiency > 0
      ? (totalCompletedForEfficiency / totalPlannedForEfficiency) * 100
      : 0;

  // ---------------------------
  // - Bloque con datos de asistencia/ausentismos y lista de vacaciones
  // - Actualmente usa datos mock como valor por defecto; reemplazar con payload real
  // ---------------------------
  const attendanceStats = useMemo(() => {
    // Datos de ejemplo (mock)
    return [
      {
        category: "Asistencia",
        percentage: 92,
        count: 92,
        color_hex: "#3b82f6",
      },
      { category: "Licencias", percentage: 3, count: 5, color_hex: "#10b981" },
      { category: "Vacaciones", percentage: 4, count: 6, color_hex: "#f59e0b" },
      {
        category: "Injustificadas",
        percentage: 1,
        count: 2,
        color_hex: "#ef4444",
      },
    ];
  }, [productionRecords]);

  // Preparar datos para gráfico tipo dona
  const pieData = useMemo(
    () =>
      attendanceStats.map((s) => ({
        name: s.category,
        value: s.percentage,
        count: s.count,
        color: s.color_hex,
      })),
    [attendanceStats],
  );
  const totalAttendance =
    pieData.find((d) => d.name === "Asistencia")?.value ?? 0;
  const totalAbsences = pieData
    .filter((d) => d.name !== "Asistencia")
    .reduce((acc, cur) => acc + (cur.count || 0), 0);

  // Lista de próximas vacaciones (ejemplo / valor por defecto)
  const vacationList = useMemo(
    () => [
      { id: "v1", employee_name: "Jorge Mena", days_count: 6 },
      { id: "v2", employee_name: "Osvaldo Núñez", days_count: 2 },
      { id: "v3", employee_name: "Carola Lazcano", days_count: 2 },
      { id: "v4", employee_name: "Benjamín Pino", days_count: 1 },
      { id: "v5", employee_name: "Antonio Pérez", days_count: 5 },
    ],
    [],
  );

  // Producción agregada por cliente y por año
  const productionByClientYear = useMemo(() => {
    const map = {};

    productionRecords.forEach((r) => {
      const dateStr = getStr(r, "fecha");
      if (!dateStr) return;

      const d = new Date(dateStr);
      if (isNaN(d)) return;

      const year = String(d.getFullYear());
      const client = resolveClientName(r);
      const val =
        Number(getVal(r, "completado")) ||
        Number(getVal(r, "completado real")) ||
        0;

      if (!map[client]) map[client] = {};
      map[client][year] = (map[client][year] || 0) + val;
    });

    return map;
  }, [productionRecords]);

  // Clientes con incremento vs promedio histórico
  const clientsWithIncrease = useMemo(() => {
    if (selectedYear === "all") return [];

    return Object.entries(productionByClientYear)
      .map(([client, years]) => {
        const current = years[selectedYear] || 0;
        const pastValues = previousYears.map((y) => years[y] || 0);
        const pastAvg =
          pastValues.length > 0
            ? pastValues.reduce((a, b) => a + b, 0) / pastValues.length
            : 0;

        return {
          client,
          diff: current - pastAvg,
          current,
          pastAvg,
        };
      })

      .filter((r) => r.diff > 0)
      .sort((a, b) => b.diff - a.diff);
  }, [productionByClientYear, selectedYear, previousYears]);

  // Clientes con mayor incremento (N principales)
  const topClientsWithIncrease = useMemo(
    () => clientsWithIncrease.slice(0, topN),
    [clientsWithIncrease, topN],
  );

  // Clientes con disminución vs promedio histórico
  const clientsWithDecrease = useMemo(() => {
    if (selectedYear === "all") return [];

    return Object.entries(productionByClientYear)
      .map(([client, years]) => {
        const current = years[selectedYear] || 0;
        const pastValues = previousYears.map((y) => years[y] || 0);
        const pastAvg =
          pastValues.length > 0
            ? pastValues.reduce((a, b) => a + b, 0) / pastValues.length
            : 0;

        return {
          client,
          diff: current - pastAvg,
          current,
          pastAvg,
        };
      })
      .filter((r) => r.diff < 0)
      .sort((a, b) => a.diff - b.diff);
  }, [productionByClientYear, selectedYear, previousYears]);

  // Clientes con mayor disminución (N principales)
  const topClientsWithDecrease = useMemo(
    () => clientsWithDecrease.slice(0, topN),
    [clientsWithDecrease, topN],
  );

  // Clientes nuevos en el `selectedYear` (sin historial en previousYears)
  const newClients = useMemo(() => {
    if (selectedYear === "all") return [];

    return Object.entries(productionByClientYear)
      .filter(
        ([_, years]) =>
          years[selectedYear] && previousYears.every((y) => !years[y]),
      )
      .map(([client, years]) => ({
        client,
        volume: years[selectedYear],
      }))
      .sort((a, b) => b.volume - a.volume);
  }, [productionByClientYear, selectedYear, previousYears]);

  // Clientes nuevos (N principales)
  const topNewClients = useMemo(
    () => newClients.slice(0, topN),
    [newClients, topN],
  );

  // Clientes perdidos: tenían volumen en años previos pero no en selectedYear
  const lostClients = useMemo(() => {
    if (selectedYear === "all") return [];

    return Object.entries(productionByClientYear)
      .filter(
        ([_, years]) =>
          !years[selectedYear] && previousYears.some((y) => years[y]),
      )
      .map(([client, years]) => ({
        client,
        lastYearVolume: Math.max(...previousYears.map((y) => years[y] || 0)),
      }))
      .sort((a, b) => b.lastYearVolume - a.lastYearVolume);
  }, [productionByClientYear, selectedYear, previousYears]);

  // Clientes perdidos (N principales)
  const topLostClients = useMemo(
    () => lostClients.slice(0, topN),
    [lostClients, topN],
  );

  // Valores listos para mostrar en el resumen ejecutivo
  const totalProduction = totalProductionVal;
  const efficiency = `${Math.round(efficiencyVal)}%`;

  // ---------------------------
  // Renderizado condicional mientras `loading` es true
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        <div className="h-64 bg-muted/30 rounded-xl" />
        <div className="h-64 bg-muted/30 rounded-xl" />
        <div className="h-96 bg-muted/30 rounded-xl col-span-2" />
      </div>
    );
  }

  


  // Render principal del layout del reporte
  return (
    <ProductionReportLayout>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:block p-2 bg-primary text-white rounded-md z-50 fixed top-4 left-4">Saltar al contenido</a>
      <div id="main-content" role="main" className="space-y-6 pb-10">
        {/* Comentario JSX: componente que controla los filtros visibles (año, mes, rango) */}
        <ProductionFilters
          filters={filters}
          onFilterChange={setFilters}
          availableYears={availableYears}
        />

        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Factory className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">
              Dashboard de Producción
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bloque izquierdo con KPIs dinámicos y tendencia de últimos 3 meses */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <div className="flex-1 min-h-[180px]">
                {dynamicKPIs.map((kpi) => (
                  <KPIItem kpi={kpi} key={kpi.id} />
                ))}
              </div>

              <div className="flex-1 min-h-[250px]">
                <Card className="h-full bg-card shadow-lg border-purple-500/20 flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4" /> Últimos 3 Meses
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 pt-0">
                    <div className="h-full w-full min-h-[180px]">
                      {previousPeriodData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={previousPeriodData}
                            margin={{
                              top: 10,
                              right: 10,
                              left: -20,
                              bottom: 0,
                            }}
                          >
                            <defs>
                              <linearGradient
                                id="colorValue"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#22d3ee"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#22d3ee"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              opacity={0.1}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="name"
                              tick={{ fill: "#64748b", fontSize: 10 }}
                              tickLine={false}
                              axisLine={{ stroke: "#334155" }}
                              interval={0}
                            />
                            <YAxis
                              tick={{ fill: "#64748b", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(val) =>
                                `${(val / 1000).toFixed(0)}k`
                              }
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f172a",
                                borderColor: "#334155",
                                color: "#f8fafc",
                                fontSize: "12px",
                              }}
                              itemStyle={{ color: "#22d3ee" }}
                              formatter={(value) => [
                                `${parseInt(value).toLocaleString()} kg`,
                                "Volumen",
                              ]}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#22d3ee"
                              fillOpacity={1}
                              fill="url(#colorValue)"
                              strokeWidth={3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          Sin datos previos
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Gráfico central: total completado agrupado por cliente */}
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
                        <CartesianGrid
                          strokeDasharray="3 3"
                          opacity={0.1}
                          horizontal
                          vertical
                          stroke="#06b6d4"
                        />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{
                            fill: "#94a3b8",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
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
                          formatter={(value) => [
                            `${parseInt(value).toLocaleString()} kg`,
                            "Volumen",
                          ]}
                        />
                        <Bar
                          dataKey="value"
                          fill="#06b6d4"
                          radius={[0, 4, 4, 0]}
                          barSize={32}
                          name="Volumen"
                          label={{
                            position: "right",
                            fill: "#fff",
                            fontSize: 12,
                            formatter: (val) => parseInt(val).toLocaleString(),
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Sin datos para el periodo seleccionado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Lista lateral con ranking de clientes por volumen */}
            <div className="lg:col-span-3 h-[500px]">
              <Card className="h-full bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Top Clientes Consolidados
                  </CardTitle>
                  <CardDescription>Ranking por volumen</CardDescription>
                </CardHeader>

                <CardContent className="overflow-y-auto pr-2 p-3 scrollbar-thin">
                  {productionByClient.length > 0 ? (
                    productionByClient.map((client) => (
                      <ClientRankItem
                        client={client}
                        key={client.id}
                        maxVolume={productionByClient[0]?.volume_kilos || 1}
                      />
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-6">
                      Sin datos
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Componente que muestra la trayectoria/ubicación de producción */}
        <section className="mt-12 block relative">
          <div className="w-full min-h-[520px] relative overflow-hidden">
            <ProductionTrajectory
              records={productionRecords}
              clientMapping={CLIENT_MAPPING}
            />
          </div>
        </section>

        {/* ================= NUEVAS SECCIONES ================= */}
        {/* ================= ANÁLISIS DE DEMANDA Y CONSUMO ================= */}
        <section className="mt-12  border border-border rounded-xl p-6">
          <Accordion type="single" collapsible>
            <AccordionItem value="demand-consumption">
              <AccordionTrigger className="text-xl font-bold">
                Análisis de Demanda y Consumo
              </AccordionTrigger>

              <AccordionContent>
                {/* FILTROS VISIBLES (REUTILIZA filters EXISTENTE) */}
                {/* Controles de año/mes que reutilizan el estado `filters` del componente */}
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Año
                    </span>
                    <select
                      className="border rounded-md px-3 py-2 bg-background text-sm"
                      value={filters.year}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, year: e.target.value }))
                      }
                    >
                      <option value="all">Todos</option>
                      {availableYears.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Mes
                    </span>
                    <select
                      className="border rounded-md px-3 py-2 bg-background text-sm"
                      value={filters.month}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, month: e.target.value }))
                      }
                    >
                      <option value="all">Todos</option>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i} value={String(i)}>
                          {new Date(2000, i).toLocaleString("es-CL", {
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* GRÁFICOS */}
                {/* Panel con Top productos y consumo de materia prima */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top productos */}
                  {/* Gráfico de barras vertical mostrando los productos con mayor volumen */}

                  <Card className="bg-card border-border shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm uppercase tracking-wider text-indigo-400">
                        Top productos por volumen producido
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="h-[320px]">
                      {topProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={topProductsFiltered}
                            layout="vertical"
                            margin={{
                              top: 10,
                              right: 40,
                              left: 40,
                              bottom: 10,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              horizontal
                              vertical={false}
                              opacity={0.2}
                            />
                            <XAxis type="number" />
                            <YAxis
                              dataKey="producto"
                              type="category"
                              width={200}
                            />
                            <Tooltip
                              formatter={(v) =>
                                `${Number(v).toLocaleString()} kg`
                              }
                            />
                            <Bar
                              dataKey="total_kg"
                              fill="#6366f1"
                              radius={[0, 6, 6, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          Sin datos de productos
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Materia prima */}
                  {/* Muestra consumo de materias primas si año y mes están seleccionados */}
                  {filters.year !== "all" && filters.month !== "all" ? (
                    <TopRawMaterialsChart
                      year={Number(filters.year)}
                      month={Number(filters.month)}
                    />
                  ) : (
                    <Card className="bg-card border-border shadow-lg flex items-center justify-center text-muted-foreground">
                      <span className="text-sm">
                        Selecciona año y mes para ver consumo de materia prima
                      </span>
                    </Card>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="mt-12  border border-border rounded-xl p-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="historical-production"
              className="border-none"
            >
              {/* PRODUCCION HISTORICA */}
              {/* Vista histórica con serie temporal mensual agregada */}
              <AccordionTrigger className="text-xl font-bold">
                Producción histórica
              </AccordionTrigger>
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                    Filtros
                  </h4>

                  {/* Año */}
                  <select
                    className="w-full border rounded-md px-3 py-2 bg-background"
                    value={historicalFilters.year}
                    onChange={(e) =>
                      setHistoricalFilters((f) => ({
                        ...f,
                        year: e.target.value,
                      }))
                    }
                  >
                    <option value="all">Todos los años</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>

                  {/* Cliente */}
                  <select
                    className="w-full border rounded-md px-3 py-2 bg-background"
                    value={historicalFilters.client}
                    onChange={(e) =>
                      setHistoricalFilters((f) => ({
                        ...f,
                        client: e.target.value,
                      }))
                    }
                  >
                    <option value="all">Todos los clientes</option>
                    {availableClients.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CONTENIDO */}
              {/* Contenido del acordeón con gráfico de densidad histórica */}
              <AccordionContent className="px-6 pb-6 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* ================= GRÁFICO ================= */}
                  {/* AreaChart que muestra producción histórica por periodo (YYYY-MM) */}
                  <div className="lg:col-span-12">
                    <Card className="bg-card border-border shadow-lg h-[420px]">
                      <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider text-indigo-400">
                          Producción histórica (kg)
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="h-full">
                        {historicalDensityData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historicalDensityData}>
                              <defs>
                                <linearGradient
                                  id="histColor"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#6366f1"
                                    stopOpacity={0.6}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#6366f1"
                                    stopOpacity={0.05}
                                  />
                                </linearGradient>
                              </defs>

                              <CartesianGrid
                                strokeDasharray="3 3"
                                opacity={0.15}
                                vertical={false}
                              />
                              <XAxis dataKey="period" />
                              <YAxis
                                tickFormatter={(v) =>
                                  `${(v / 1000).toFixed(0)}k`
                                }
                              />
                              <Tooltip
                                formatter={(v) =>
                                  `${Number(v).toLocaleString()} kg`
                                }
                              />

                              <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#6366f1"
                                fill="url(#histColor)"
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            No hay datos para los filtros seleccionados
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="mt-12  border border-border rounded-xl p-6">
          {/* Analítica de Clientes: incrementos, nuevos, perdidos, etc. */}
          <Accordion type="single" collapsible>
            <AccordionItem value="client-analytics">
              <AccordionTrigger className="text-xl font-bold">
                Analítica de Clientes
              </AccordionTrigger>
              <div className="flex items-center gap-6 mb-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Año de análisis
                  </span>

                  <select
                    className="border rounded-md px-3 py-2 bg-background"
                    value={clientAnalyticsYear}
                    onChange={(e) => setClientAnalyticsYear(e.target.value)}
                  >
                    <option value="all">Todos los años</option>
                    {clientAnalyticsYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Top
                  </span>

                  <select
                    className="border rounded-md px-3 py-2 bg-background"
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              <AccordionContent className="pt-6 space-y-6">
                {/* FILA 1: Incrementos / Descensos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="h-[380px] bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-sm uppercase tracking-wider text-emerald-400">
                        Incremento de demanda por cliente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-full">
                      <ClientBarChart
                        data={topClientsWithIncrease}
                        valueKey="diff"
                        valueLabel="Incremento vs promedio histórico"
                      />
                    </CardContent>
                  </Card>

                  <Card className="h-[380px] bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-sm uppercase tracking-wider text-rose-400">
                        Disminución de demanda por cliente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-full">
                      <ClientBarChart
                        data={topClientsWithDecrease}
                        valueKey="diff"
                        valueLabel="Disminución vs promedio histórico"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* FILA 2: Nuevos / Perdidos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="h-[300px] bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-sm uppercase tracking-wider text-indigo-400">
                        Clientes nuevos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-full">
                      <ClientBarChart
                        data={topNewClients}
                        valueKey="volume"
                        valueLabel="Demanda primer año"
                      />
                    </CardContent>
                  </Card>

                  <Card className="h-[300px] bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-sm uppercase tracking-wider text-amber-400">
                        Clientes perdidos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-full">
                      <ClientBarChart
                        data={topLostClients}
                        valueKey="lastYearVolume"
                        valueLabel="Última demanda registrada"
                      />
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="mt-12 border border-border rounded-xl p-6">
          <Accordion type="single" collapsible>
            <AccordionItem value="interannual-comparison">
              <AccordionTrigger className="text-xl font-bold">
                Comparativo Interanual de Producción
              </AccordionTrigger>

              <AccordionContent>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  {/* Filtros de comparación */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Año A
                      </span>
                      <select
                        className="border rounded-md px-3 py-2 bg-background text-sm"
                        value={compareYearA}
                        onChange={(e) => setCompareYearA(e.target.value)}
                      >
                        {availableYears.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Año B
                      </span>
                      <select
                        className="border rounded-md px-3 py-2 bg-background text-sm"
                        value={compareYearB}
                        onChange={(e) => setCompareYearB(e.target.value)}
                      >
                        {availableYears.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Gráfico */}
                <div className="h-[360px]">
                  <div className="flex items-center justify-end gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-sm px-2 py-1 border rounded"
                        onClick={() => setShowDots((s) => !s)}
                        aria-pressed={showDots}
                      >
                        {showDots ? "Ocultar puntos" : "Mostrar puntos"}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* custom legend toggles */}
                      {[compareYearA, compareYearB].filter(Boolean).map((y, idx) => {
                        const color = idx === 0 ? "#6366f1" : "#22c55e";
                        const visible = visibleSeries?.[y] ?? true;
                        return (
                          <button
                            key={y}
                            onClick={() => setVisibleSeries((vs) => ({ ...vs, [y]: !vs[y] }))}
                            className={`flex items-center gap-2 px-2 py-1 rounded border ${visible ? '' : 'opacity-40'}`}
                            aria-pressed={visible}
                          >
                            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                            <span className="text-xs">{y}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {interannualComparison.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={interannualComparison}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          opacity={0.2}
                          vertical={false}
                        />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip
                          formatter={(v) => `${Number(v).toLocaleString()} kg`}
                        />
                        <Legend />

                        {visibleSeries?.[compareYearA] !== false && (
                          <Line
                            type="monotone"
                            dataKey={compareYearA}
                            name={compareYearA}
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={showDots ? { r: 3 } : false}
                          />
                        )}

                        {visibleSeries?.[compareYearB] !== false && (
                          <Line
                            type="monotone"
                            dataKey={compareYearB}
                            name={compareYearB}
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={showDots ? { r: 3 } : false}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Selecciona dos años válidos para visualizar el comparativo
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* SECTION: ASISTENCIA / RRHH (layout basado en imagen) */}
        <section className="space-y-6 pt-6 border-t border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-emerald-500" />
            <h2 className="text-2xl font-bold tracking-tight">
              Informe de Gestión y RRHH
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-blue-400">
                    Desglose Ausentismos
                  </CardTitle>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-bold text-blue-500">
                      {totalAttendance}% Asistencia
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="h-[260px] relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="45%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-foreground">
                      {totalAttendance}%
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">
                      GLOBAL
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                      RESUMEN POR CATEGORÍA
                    </h4>
                    {pieData
                      .filter((d) => d.name !== "Asistencia")
                      .map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between p-2 rounded bg-muted/20 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {item.name === "Licencias" && (
                              <Briefcase className="w-4 h-4 text-emerald-500" />
                            )}
                            {item.name === "Vacaciones" && (
                              <Plane className="w-4 h-4 text-amber-500" />
                            )}
                            {item.name === "Injustificadas" && (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span>{item.name}</span>
                          </div>
                          <span className="font-mono font-medium">
                            {item.count}
                          </span>
                        </div>
                      ))}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                      PRÓXIMAS VACACIONES
                    </h4>
                    <div className="max-h-[140px] overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-muted">
                      {vacationList.map((v) => (
                        <div
                          key={v.id}
                          className="flex justify-between text-xs text-muted-foreground hover:text-foreground"
                        >
                          <span>{v.employee_name}</span>
                          <span>{v.days_count} días</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RIGHT: Executive RRHH summary */}
            <ExecutiveSummary
              totalProduction={totalProduction}
              efficiency={efficiency}
              totalAbsences={totalAbsences}
              totalAttendance={totalAttendance}
            />
          </div>
        </section>
      </div>
    </ProductionReportLayout>
  );
};

export default ProductionReport;
