import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useProductionReports } from '@/hooks/useReports';
import ProductionFilters from '@/components/ProductionFilters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  Factory,
  FileText,
  History,
  Map as MapIcon,
  Users,
  CheckCircle2,
  Briefcase,
  Plane,
  XCircle,
  Activity,
  Target,
  AlertTriangle
} from "lucide-react";
import { motion } from 'framer-motion';
import ProductionTrajectory from '@/components/reports/ProductionTrajectory';
import ProductionReportLayout from '@/components/reports/ProductionReportLayout';


// --- TRANSLATION/MAPPING CONSTANTS ---
const TRANSLATION_MAP = {
  'producción total': 'Producción Total',
  'enviado a los inplants': 'Enviado a las Plantas Cliente',
};

// --- CLIENT MAPPING (ejemplo empresarial) ---
const CLIENT_MAPPING = {
  'C0010': 'CMPC Osorno',
  'C0005': 'Chilempack',
  'C0029': 'Chilempack',
  'C0031': 'CMPC Osorno',
  'C0049': 'CMPC Buin Norte',
  'C0059': 'CMPC Buin Sur',
  'C0052': 'Til Til'
};

const translateText = (key) => TRANSLATION_MAP[key?.toLowerCase()] || key;

const ProductionReport = () => {
  const {
    productionRecords = [],
    kpis: initialKpis = [],
    plantsMapData,
    topProducts = [],
    loading
  } = useProductionReports();

  // ---------------------------
  // Filters
  // ---------------------------
  const [filters, setFilters] = useState({
    year: 'all',
    month: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Safe getters (case-insensitive-ish)
  const getVal = (r = {}, key) => r?.[key] ?? r?.[key.charAt(0).toUpperCase() + key.slice(1)] ?? 0;
  const getStr = (r = {}, key) => {
    if (!r) return '';
    return r?.[key] ?? r?.[key.charAt(0).toUpperCase() + key.slice(1)] ?? '';
  };

  // Resolve client name by code mapping or fallback to 'cliente' field
  const resolveClientName = (r = {}) => {
    const code = r['CveCliente'] || r['cvecliente'] || r['cveCliente'] || r['CVE_CLIENTE'];
    if (code) {
      const cleanCode = String(code).trim();
      if (CLIENT_MAPPING[cleanCode]) return CLIENT_MAPPING[cleanCode];
    }
    const rawName = getStr(r, 'cliente');
    return rawName || 'Sin Cliente';
  };

  // Auto-set filters to latest date in data
  useEffect(() => {
    if (!loading && productionRecords && productionRecords.length > 0 && !filtersInitialized) {
      let maxDate = null;
      productionRecords.forEach(r => {
        const dStr = getStr(r, 'fecha');
        if (!dStr) return;
        const d = new Date(dStr);
        if (!isNaN(d.getTime())) {
          if (!maxDate || d > maxDate) maxDate = d;
        }
      });
      if (maxDate) {
        setFilters(prev => ({
          ...prev,
          year: String(maxDate.getFullYear()),
          month: String(maxDate.getMonth())
        }));
        setFiltersInitialized(true);
      }
    }
  }, [loading, productionRecords, filtersInitialized]);

  // Extract available years
  const availableYears = useMemo(() => {
    const setYears = new Set();
    productionRecords.forEach(r => {
      const dStr = getStr(r, 'fecha');
      if (!dStr) return;
      const d = new Date(dStr);
      if (!isNaN(d.getTime())) setYears.add(String(d.getFullYear()));
    });
    return Array.from(setYears).sort((a, b) => b - a);
  }, [productionRecords]);

  // Filtering logic
  const filteredRecords = useMemo(() => {
    if (!productionRecords) return [];
    return productionRecords.filter(record => {
      const dateStr = getStr(record, 'fecha');
      if (!dateStr) return false;
      const recordDate = new Date(dateStr);
      if (isNaN(recordDate.getTime())) return false;

      if (filters.year !== 'all' && String(recordDate.getFullYear()) !== filters.year) return false;
      if (filters.month !== 'all' && String(recordDate.getMonth()) !== filters.month) return false;
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom); from.setHours(0, 0, 0, 0);
        if (recordDate < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo); to.setHours(23, 59, 59, 999);
        if (recordDate > to) return false;
      }
      return true;
    });
  }, [productionRecords, filters]);

  // Previous 3 months data for area chart (unchanged)
  const previousPeriodData = useMemo(() => {
    if (!productionRecords || productionRecords.length === 0) return [];
    let anchorDate = new Date();
    if (filters.dateFrom) { anchorDate = new Date(filters.dateFrom); anchorDate.setHours(0, 0, 0, 0); }
    else {
      const currentYear = new Date().getFullYear();
      const y = filters.year !== 'all' ? parseInt(filters.year) : currentYear;
      const m = filters.month !== 'all' ? parseInt(filters.month) : 0;
      anchorDate = new Date(y, m, 1);
    }
    const endDate = new Date(anchorDate);
    const startDate = new Date(anchorDate); startDate.setMonth(startDate.getMonth() - 3);

    const pastRecords = productionRecords.filter(r => {
      const dStr = getStr(r, 'fecha'); if (!dStr) return false;
      const d = new Date(dStr); return d >= startDate && d < endDate;
    });

    const grouped = {};
    for (let d = new Date(startDate); d < endDate; d.setMonth(d.getMonth() + 1)) {
      const sortKey = d.toISOString().slice(0, 7);
      const label = d.toLocaleString('es-CL', { month: 'short' });
      grouped[sortKey] = { name: label.charAt(0).toUpperCase() + label.slice(1), sortKey, value: 0 };
    }
    pastRecords.forEach(r => {
      const d = new Date(getStr(r, 'fecha'));
      const sortKey = d.toISOString().slice(0, 7);
      if (grouped[sortKey]) {
        const val = Number(getVal(r, 'completado')) || Number(getVal(r, 'completado real')) || 0;
        grouped[sortKey].value += val;
      }
    });
    return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [productionRecords, filters]);

  // Dynamic KPIs
  const dynamicKPIs = useMemo(() => {
    const totalCompleted = filteredRecords.reduce((acc, r) => acc + (Number(getVal(r, 'completado')) || Number(getVal(r, 'completado real')) || 0), 0);
    if (!productionRecords || productionRecords.length === 0) return initialKpis || [];
    return [{ id: 'k1', label: translateText('Producción Total'), value: totalCompleted, unit: 'kg', trend_up: true, subtext: translateText('Enviado a las Plantas Cliente') }];
  }, [filteredRecords, initialKpis, productionRecords]);

  // Production by plant
  const productionByPlant = useMemo(() => {
    const grouped = {};
    filteredRecords.forEach(r => {
      const name = resolveClientName(r);
      const val = Number(getVal(r, 'completado')) || Number(getVal(r, 'completado real')) || 0;
      grouped[name] = (grouped[name] || 0) + val;
    });
    return Object.keys(grouped).map(k => ({ name: k, value: grouped[k] })).sort((a, b) => b.value - a.value);
  }, [filteredRecords]);

  // Top 5 clients
  const productionByClient = useMemo(() => {
    const grouped = {};
    filteredRecords.forEach(r => {
      const client = resolveClientName(r);
      const val = Number(getVal(r, 'completado')) || Number(getVal(r, 'completado real')) || 0;
      grouped[client] = (grouped[client] || 0) + val;
    });
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, vol], i) => ({ id: name, rank: i + 1, client_name: name, volume_kilos: vol }));
  }, [filteredRecords]);

  // Production by article
  const productionByArticle = useMemo(() => {
    const grouped = {};
    filteredRecords.forEach(r => {
      const art = getStr(r, 'articulo') || 'Varios';
      const val = Number(getVal(r, 'completado')) || Number(getVal(r, 'completado real')) || 0;
      grouped[art] = (grouped[art] || 0) + val;
    });
    return Object.keys(grouped).map(k => ({ name: k, value: grouped[k] })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredRecords]);

  // Helper constants
  const totalProductionVal = dynamicKPIs.find(k => k.label === 'Producción Total')?.value || 0;
  const totalPlannedForEfficiency = filteredRecords.reduce((acc, r) => acc + (Number(getVal(r, 'planificado')) || Number(getVal(r, 'planificado real')) || 0), 0);
  const totalCompletedForEfficiency = filteredRecords.reduce((acc, r) => acc + (Number(getVal(r, 'completado')) || Number(getVal(r, 'completado real')) || 0), 0);
  const efficiencyVal = totalPlannedForEfficiency > 0 ? (totalCompletedForEfficiency / totalPlannedForEfficiency) * 100 : 0;


  // ---------------------------
  // ATTENDANCE / RRHH SECTION
  // - Uses fallback/mock data if you don't yet have real attendance payload
  // Replace attendanceStats & vacationList with real data when available
  // ---------------------------
  const attendanceStats = useMemo(() => {
    // Fallback mock (replace with real computation if you have attendance data)
    return [
      { category: 'Asistencia', percentage: 92, count: 92, color_hex: '#3b82f6' },
      { category: 'Licencias', percentage: 3, count: 5, color_hex: '#10b981' },
      { category: 'Vacaciones', percentage: 4, count: 6, color_hex: '#f59e0b' },
      { category: 'Injustificadas', percentage: 1, count: 2, color_hex: '#ef4444' }
    ];
  }, [productionRecords]); // keep dependency so it can be swapped when you feed real data

  const pieData = useMemo(() => attendanceStats.map(s => ({ name: s.category, value: s.percentage, count: s.count, color: s.color_hex })), [attendanceStats]);
  const totalAttendance = pieData.find(d => d.name === 'Asistencia')?.value ?? 0;
  const totalAbsences = pieData.filter(d => d.name !== 'Asistencia').reduce((acc, cur) => acc + (cur.count || 0), 0);

  // Example upcoming vacations list (fallback)
  const vacationList = useMemo(() => ([
    { id: 'v1', employee_name: 'Jorge Mena', days_count: 6 },
    { id: 'v2', employee_name: 'Osvaldo Núñez', days_count: 2 },
    { id: 'v3', employee_name: 'Carola Lazcano', days_count: 2 },
    { id: 'v4', employee_name: 'Benjamín Pino', days_count: 1 },
    { id: 'v5', employee_name: 'Antonio Pérez', days_count: 5 }
  ]), []);

  // Metrics shown in executive RRHH card
  const totalProduction = totalProductionVal;
  const efficiency = `${Math.round(efficiencyVal)}%`;

  // ---------------------------
  // RENDER / LOADING
  // ---------------------------
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        <div className="h-64 bg-muted/30 rounded-xl" />
        <div className="h-64 bg-muted/30 rounded-xl" />
        <div className="h-96 bg-muted/30 rounded-xl col-span-2" />
      </div>
    );
  }

  return (
    <ProductionReportLayout>

      <div className="space-y-6 pb-10">
        {/* Filters */}
        <ProductionFilters
          filters={filters}
          onFilterChange={setFilters}
          availableYears={availableYears}
        />

        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Factory className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Dashboard de Producción</h2>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT: KPIs & Trend */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <div className="flex-1 min-h-[180px]">
                {dynamicKPIs.map(kpi => (
                  <Card key={kpi.id} className="h-full bg-card border-cyan-500/20 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-cyan-400 font-bold uppercase tracking-wider text-sm">{kpi.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-2">
                        <span className="text-4xl lg:text-5xl font-extrabold text-blue-700 tracking-tight">
                          {parseFloat(kpi.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                        <div className="text-xl font-bold text-slate-500 mt-1">{kpi.unit?.toUpperCase()}</div>
                      </div>
                      {kpi.subtext && <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">{kpi.subtext}</p>}
                    </CardContent>
                  </Card>
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
                          <AreaChart data={previousPeriodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#334155' }} interval={0} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }} itemStyle={{ color: '#22d3ee' }} formatter={(value) => [`${parseInt(value).toLocaleString()} kg`, 'Volumen']} />
                            <Area type="monotone" dataKey="value" stroke="#22d3ee" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">Sin datos previos</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* CENTER: Production by Plant */}
            <div className="lg:col-span-6 h-[500px]">
              <Card className="h-full bg-card border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)] flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#06b6d4] text-lg font-bold tracking-wide">Producción por Planta</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Total completado agrupado por planta del holding</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 pt-4">
                  {productionByPlant.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productionByPlant} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal vertical stroke="#06b6d4" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={140} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }} cursor={{ fill: '#06b6d4', opacity: 0.1 }} formatter={(value) => [`${parseInt(value).toLocaleString()} kg`, 'Volumen']} />
                        <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={32} name="Volumen" label={{ position: 'right', fill: '#fff', fontSize: 12, formatter: val => parseInt(val).toLocaleString() }} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">Sin datos para el periodo seleccionado</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Top Clientes (vertical narrow) */}
            <div className="lg:col-span-3 h-[500px]">
              <Card className="h-full bg-card border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Top Clientes Consolidados</CardTitle>
                  <CardDescription>Ranking por volumen</CardDescription>
                </CardHeader>

                <CardContent className="overflow-y-auto pr-2 scrollbar-thin">
                  {productionByClient.length > 0 ? productionByClient.map(client => (
                    <div key={client.id} className="flex items-center justify-between mb-3 p-2 rounded-lg bg-white/5 hover:bg-white/10">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${client.rank <= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {client.rank}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{client.client_name}</p>
                          <div className="bg-muted/30 h-1.5 mt-1 rounded-full overflow-hidden w-24">
                            <div className="h-full bg-primary/70 rounded-full" style={{ width: `${(client.volume_kilos / (productionByClient[0]?.volume_kilos || 1)) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-mono text-muted-foreground">{parseInt(client.volume_kilos).toLocaleString()} kg</span>
                    </div>
                  )) : <div className="text-center text-muted-foreground py-6">Sin datos</div>}
                </CardContent>
              </Card>
            </div>

          </div>
        </section>

        {/* SECTION 2: Trajectory */}
        <section className="mt-12 block relative">
          <div className="w-full min-h-[520px] relative overflow-hidden">
            <ProductionTrajectory records={productionRecords} clientMapping={CLIENT_MAPPING} />
          </div>
        </section>







        {/* ================= NUEVAS SECCIONES ================= 

        {/* ================= PRODUCTOS MÁS DEMANDADOS ================= 
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xl font-bold tracking-tight">
              Productos más demandados
            </h3>
          </div>

          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-indigo-400">
                Top productos por volumen producido
              </CardTitle>
            </CardHeader>

            <CardContent className="h-[380px]">
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ top: 10, right: 40, left: 40, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} opacity={0.2} />

                    <XAxis
                      type="number"
                      tick={{ fill: '#475569', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      type="category"
                      dataKey="producto"
                      width={240}
                      tick={{
                        fill: '#0f172a',
                        fontSize: 12,
                        fontWeight: 500
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      formatter={(v) => [`${Number(v).toLocaleString()} kg`, 'Volumen']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />

                    <Bar
                      dataKey="total_kg"
                      fill="#6366f1"
                      radius={[0, 6, 6, 0]}
                      barSize={28}
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
        </section>


        <section className="h-[480px] bg-muted/40 border border-border rounded-xl flex items-center justify-center">
          <span className="text-xl font-bold">Producción histórica</span>
        </section>

        <section className="h-[420px] bg-muted/40 border border-border rounded-xl flex items-center justify-center">
          <span className="text-xl font-bold">Producción por planta</span>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[380px] bg-muted/40 border border-border rounded-xl flex items-center justify-center">
            Incrementos
          </div>
          <div className="h-[380px] bg-muted/40 border border-border rounded-xl flex items-center justify-center">
            Descensos
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[300px] bg-muted/40 border border-border rounded-xl flex items-center justify-center">
            Clientes nuevos
          </div>
          <div className="h-[300px] bg-muted/40 border border-border rounded-xl flex items-center justify-center">
            Clientes perdidos
          </div>
        </section>

        <section className="h-[480px] bg-muted/40 border border-border rounded-xl flex items-center justify-center">
          <span className="text-xl font-bold">Comparativo interanual</span>
        </section>
*/}

        {/* SECTION: ASISTENCIA / RRHH (layout basado en imagen) */}
        <section className="space-y-6 pt-6 border-t border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-emerald-500" />
            <h2 className="text-2xl font-bold tracking-tight">Informe de Gestión y RRHH</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT: Donut + Legend + Vacations */}
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-blue-400">Desglose Ausentismos</CardTitle>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-bold text-blue-500">{totalAttendance}% Asistencia</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Donut chart */}
                <div className="h-[260px] relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="45%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                        {pieData.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-foreground">{totalAttendance}%</span>
                    <span className="text-[10px] text-muted-foreground uppercase">GLOBAL</span>
                  </div>
                </div>

                {/* Legend + Vacations */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">RESUMEN POR CATEGORÍA</h4>
                    {pieData.filter(d => d.name !== 'Asistencia').map(item => (
                      <div key={item.name} className="flex items-center justify-between p-2 rounded bg-muted/20 text-sm">
                        <div className="flex items-center gap-2">
                          {item.name === 'Licencias' && <Briefcase className="w-4 h-4 text-emerald-500" />}
                          {item.name === 'Vacaciones' && <Plane className="w-4 h-4 text-amber-500" />}
                          {item.name === 'Injustificadas' && <XCircle className="w-4 h-4 text-red-500" />}
                          <span>{item.name}</span>
                        </div>
                        <span className="font-mono font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">PRÓXIMAS VACACIONES</h4>
                    <div className="max-h-[140px] overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-muted">
                      {vacationList.map(v => (
                        <div key={v.id} className="flex justify-between text-xs text-muted-foreground hover:text-foreground">
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
            <Card className="bg-card border-primary/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-3 opacity-20">
                <FileText className="w-24 h-24 text-primary" />
              </div>
              <CardHeader className="relative z-10 pb-4">
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Resumen Ejecutivo Mensual
                </CardTitle>
                <CardDescription>Consolidado de KPIs Críticos y Eficiencia</CardDescription>
              </CardHeader>

              <CardContent className="relative z-10 space-y-6">
                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background/40 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
                    <span className="text-xs text-muted-foreground block mb-1">Total Producción</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-foreground">{parseFloat(totalProduction).toLocaleString()}</span>
                      <span className="text-xs font-mono text-primary">kg</span>
                    </div>
                  </div>

                  <div className="bg-background/40 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
                    <span className="text-xs text-muted-foreground block mb-1">Eficiencia Global</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-emerald-500">{efficiency}</span>
                      <Target className="w-3 h-3 text-emerald-500 ml-1" />
                    </div>
                  </div>

                  <div className="bg-background/40 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
                    <span className="text-xs text-muted-foreground block mb-1">Reproceso</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-amber-500">1.2%</span>
                      <AlertTriangle className="w-3 h-3 text-amber-500 ml-1" />
                    </div>
                  </div>

                  <div className="bg-background/40 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
                    <span className="text-xs text-muted-foreground block mb-1">Ausentismo Total</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-red-400">{totalAbsences}</span>
                      <span className="text-xs text-muted-foreground">colaboradores</span>
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <h4 className="text-xs font-bold uppercase text-primary mb-3">Highlights del Mes</h4>
                  <ul className="space-y-2">
                    <li className="text-sm flex items-start gap-2 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>La producción total superó la meta en un <strong>4.5%</strong> gracias a la optimización en planta Santiago.</span>
                    </li>
                    <li className="text-sm flex items-start gap-2 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>Se observa un leve aumento en reprocesos (<strong>+0.3%</strong>) en la línea de envasado automatizado.</span>
                    </li>
                    <li className="text-sm flex items-start gap-2 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>Asistencia promedio se mantiene estable en <strong>{totalAttendance}%</strong>, con baja incidencia de licencias médicas.</span>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-muted-foreground/50 uppercase">Última actualización: hace 2 horas</span>
                  <button className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors">
                    Ver Reporte Completo <FileText className="w-3 h-3" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

    </ProductionReportLayout>
  );
};

export default ProductionReport;
