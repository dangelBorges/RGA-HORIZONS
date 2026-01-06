import { useMemo } from "react";

export default function useProductionReportData({
  productionRecords = [],
  initialKpis = [],
  filters = {},
  historicalFilters = {},
  compareYearA,
  compareYearB,
  clientAnalyticsYear,
  topN = 10,
}) {
  // Helpers defensivos
  const asNumber = (v) => {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    const s = String(v).replace(/[^0-9.-]/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  const pickString = (r, keys) => {
    for (const k of keys) {
      if (!r) continue;
      const v = r[k] ?? r[k.charAt(0).toUpperCase() + k.slice(1)];
      if (v) return String(v);
    }
    return "";
  };

  const dateFromRecord = (r) => {
    const v = r?.fecha ?? r?.Fecha ?? r?.date ?? r?.Date;
    const d = v ? new Date(v) : null;
    return d && !isNaN(d) ? d : null;
  };

  // Available years
  const availableYears = useMemo(() => {
    const set = new Set();
    for (const r of productionRecords || []) {
      const d = dateFromRecord(r);
      if (d) set.add(d.getFullYear());
    }
    return Array.from(set).sort();
  }, [productionRecords]);

  const filteredRecords = useMemo(() => productionRecords || [], [productionRecords]);

  // Production by plant (group by 'planta' || 'plant' || cliente)
  const productionByPlant = useMemo(() => {
    const map = new Map();
    for (const r of filteredRecords) {
      const plant = pickString(r, ["planta", "plant", "planta_nombre", "cliente"]) || "Sin Planta";
      const kilos = asNumber(r.kilos ?? r.volume_kilos ?? r.volume ?? r.cantidad ?? r.kg);
      const prev = map.get(plant) || 0;
      map.set(plant, prev + kilos);
    }
    return Array.from(map.entries())
      .map(([plant, volume_kilos], idx) => ({ id: idx + 1, plant, volume_kilos }))
      .sort((a, b) => b.volume_kilos - a.volume_kilos);
  }, [filteredRecords]);

  // Production by client (group by cliente / cvecliente)
  const productionByClient = useMemo(() => {
    const map = new Map();
    for (const r of filteredRecords) {
      const client = pickString(r, ["cliente", "client", "customer", "CveCliente", "cvecliente"]) || "Sin Cliente";
      const kilos = asNumber(r.kilos ?? r.volume_kilos ?? r.volume ?? r.cantidad ?? r.kg);
      map.set(client, (map.get(client) || 0) + kilos);
    }
    return Array.from(map.entries())
      .map(([client, volume_kilos], idx) => ({ id: idx + 1, client, volume_kilos }))
      .sort((a, b) => b.volume_kilos - a.volume_kilos);
  }, [filteredRecords]);

  // Top products
  const topProductsFiltered = useMemo(() => {
    const map = new Map();
    for (const r of filteredRecords) {
      const prod = pickString(r, ["producto", "product", "productName", "descripcion", "producto_desc"]) || "Sin Producto";
      const kilos = asNumber(r.kilos ?? r.volume_kilos ?? r.volume ?? r.cantidad ?? r.kg);
      map.set(prod, (map.get(prod) || 0) + kilos);
    }
    return Array.from(map.entries())
      .map(([product, volume_kilos]) => ({ product, volume_kilos }))
      .sort((a, b) => b.volume_kilos - a.volume_kilos)
      .slice(0, topN);
  }, [filteredRecords, topN]);

  // Historical density: aggregate by YYYY-MM
  const historicalDensityData = useMemo(() => {
    const map = new Map();
    for (const r of filteredRecords) {
      const d = dateFromRecord(r);
      if (!d) continue;
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const kilos = asNumber(r.kilos ?? r.volume_kilos ?? r.volume ?? r.cantidad ?? r.kg);
      map.set(period, (map.get(period) || 0) + kilos);
    }
    return Array.from(map.entries())
      .map(([period, volume_kilos]) => ({ period, volume_kilos }))
      .sort((a, b) => (a.period > b.period ? 1 : -1));
  }, [filteredRecords]);

  // Previous period: last 3 periods from historicalDensityData
  const previousPeriodData = useMemo(() => {
    const arr = historicalDensityData || [];
    if (arr.length === 0) return [];
    return arr.slice(-3).map((d) => ({ period: d.period, value: d.volume_kilos }));
  }, [historicalDensityData]);

  // Interannual comparison: for compareYearA and compareYearB build per-month volumes
  const interannualComparison = useMemo(() => {
    if (!compareYearA || !compareYearB) return [];
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
    const byYearMonth = {};
    for (const r of filteredRecords) {
      const d = dateFromRecord(r);
      if (!d) continue;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const kilos = asNumber(r.kilos ?? r.volume_kilos ?? r.volume ?? r.cantidad ?? r.kg);
      const key = `${y}-${m}`;
      byYearMonth[key] = (byYearMonth[key] || 0) + kilos;
    }
    const res = months.map((m) => {
      const period = `${m}`;
      const volA = byYearMonth[`${compareYearA}-${m}`] || 0;
      const volB = byYearMonth[`${compareYearB}-${m}`] || 0;
      return {
        period,
        [`volume_${compareYearA}`]: volA,
        [`volume_${compareYearB}`]: volB,
        [`diff_${compareYearB}_${compareYearA}`]: volB - volA,
      };
    });
    return res;
  }, [filteredRecords, compareYearA, compareYearB]);

  // Some derived small values
  const dynamicKPIs = initialKpis || [];
  const totalProductionVal = dynamicKPIs.find((k) => k.label === "Producción Total")?.value || historicalDensityData.reduce((s, x) => s + (x.volume_kilos || 0), 0);
  const efficiencyVal = 0;

  const attendanceStats = {};
  const pieData = [
    { name: "Asistencia", value: 80, color: "#10B981", count: 80 },
    { name: "Licencias", value: 10, color: "#06B6D4", count: 10 },
    { name: "Vacaciones", value: 6, color: "#F59E0B", count: 6 },
    { name: "Injustificadas", value: 4, color: "#EF4444", count: 4 },
  ];
  const totalAttendance = 80;
  const totalAbsences = 20;
  const vacationList = [];

  const productionByArticle = [];
  const availableClients = Array.from(new Set(productionByClient.map((c) => c.client)));
  const historicalFilteredRecords = filteredRecords;

  const productionByClientYear = [];
  const clientsWithIncrease = [];
  const topClientsWithIncrease = [];
  const clientsWithDecrease = [];
  const topClientsWithDecrease = [];
  const newClients = [];
  const topNewClients = [];
  const lostClients = [];
  const topLostClients = [];

  return {
    availableYears,
    filteredRecords,
    previousPeriodData,
    dynamicKPIs,
    productionByPlant,
    productionByClient,
    topProductsFiltered,
    productionByArticle,
    availableClients,
    historicalFilteredRecords,
    historicalDensityData,
    interannualComparison,
    totalProductionVal,
    efficiencyVal,
    attendanceStats,
    pieData,
    totalAttendance,
    totalAbsences,
    vacationList,
    productionByClientYear,
    clientsWithIncrease,
    topClientsWithIncrease,
    clientsWithDecrease,
    topClientsWithDecrease,
    newClients,
    topNewClients,
    lostClients,
    topLostClients,
  };
}
