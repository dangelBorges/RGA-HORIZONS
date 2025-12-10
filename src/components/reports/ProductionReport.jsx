import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useProductionReports } from '@/hooks/useReports';
import ProductionFilters from '@/components/ProductionFilters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  Factory,
  TrendingUp,
  FileText,
  History,
  Map as MapIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import ProductionMap from '@/components/reports/ProductionMap';
import ProductionTrajectory from '@/components/reports/ProductionTrajectory';

// --- TRANSLATION/MAPPING CONSTANTS ---
const TRANSLATION_MAP = {
  'producción total': 'Producción Total',
  'enviado a los inplants': 'Enviado a las Plantas Cliente', // Traducimos "INPLANTS" a "Plantas Cliente"
};

// --- CLIENT MAPPING (No se traduce, se mantiene específico de la empresa) ---
const CLIENT_MAPPING = {
  'C0010': 'CMPC Osorno',
  'C0005': 'Chilempack',
  'C0029': 'Chilempack',
  'C0031': 'CMPC Osorno',
  'C0049': 'CMPC Buin Norte',
  'C0059': 'CMPC Buin Sur',
  'C0052': 'Til Til'
};

const translateText = (key) => TRANSLATION_MAP[key.toLowerCase()] || key;

const ProductionReport = () => {
  const {
    productionRecords,
    kpis: initialKpis,
    plantsMapData,
    loading
  } = useProductionReports();

  // Filter State
  const [filters, setFilters] = useState({
    year: 'all',
    month: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Helper to safely get value regardless of casing
  const getVal = (r, key) => r[key] || r[key.charAt(0).toUpperCase() + key.slice(1)] || 0;

  // Enhanced string getter that can look for CveCliente specifically
  const getStr = (r, key) => {
    if (!r) return '';
    return r[key] || r[key.charAt(0).toUpperCase() + key.slice(1)] || '';
  };

  // Dedicated helper to resolve Client Name using the Mapping
  const resolveClientName = (r) => {
    // Try to find the code in various casing possibilities
    const code = r['CveCliente'] || r['cvecliente'] || r['cveCliente'] || r['CVE_CLIENTE'];

    if (code) {
      const cleanCode = code.toString().trim();
      if (CLIENT_MAPPING[cleanCode]) {
        return CLIENT_MAPPING[cleanCode];
      }
    }

    // Fallback to existing client name field if no code mapping found
    const rawName = getStr(r, 'cliente');
    return rawName || 'Sin Cliente';
  };

  // --- AUTO-SET FILTERS TO LATEST DATA ---
  useEffect(() => {
    if (!loading && productionRecords && productionRecords.length > 0 && !filtersInitialized) {
      // Find latest date in records
      let maxDate = null;

      productionRecords.forEach(r => {
        const dStr = getStr(r, 'fecha');
        if (dStr) {
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) {
            if (!maxDate || d > maxDate) {
              maxDate = d;
            }
          }
        }
      });

      if (maxDate) {
        setFilters(prev => ({
          ...prev,
          year: maxDate.getFullYear().toString(),
          month: maxDate.getMonth().toString(),
        }));
        setFiltersInitialized(true);
      }
    }
  }, [loading, productionRecords, filtersInitialized]);

  // --- EXTRACT AVAILABLE YEARS ---
  const availableYears = useMemo(() => {
    if (!productionRecords) return [];

    const yearsSet = new Set();
    productionRecords.forEach(record => {
      const dateStr = getStr(record, 'fecha');
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          yearsSet.add(date.getFullYear().toString());
        }
      }
    });

    // Convert Set to array and sort descending (newest first)
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [productionRecords]);

  // --- FILTERING LOGIC ---
  const filteredRecords = useMemo(() => {
    if (!productionRecords) return [];

    return productionRecords.filter(record => {
      const dateStr = getStr(record, 'fecha');
      if (!dateStr) return false;

      const recordDate = new Date(dateStr);
      if (isNaN(recordDate.getTime())) return false;

      // 1. Year Filter
      if (filters.year !== 'all') {
        if (recordDate.getFullYear().toString() !== filters.year) return false;
      }

      // 2. Month Filter
      if (filters.month !== 'all') {
        if (recordDate.getMonth().toString() !== filters.month) return false;
      }

      // 3. Date Range Filter
      if (filters.dateFrom) {
        // Reset time to start of day for accurate comparison
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0); // Aseguramos el inicio del día
        if (recordDate < fromDate) return false;
      }
      if (filters.dateTo) {
        // Set time to end of day
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (recordDate > toDate) return false;
      }

      return true;
    });
  }, [productionRecords, filters]);

  // --- PREVIOUS 3 MONTHS DENSITY DATA ---
  const previousPeriodData = useMemo(() => {
    if (!productionRecords || productionRecords.length === 0) return [];

    // 1. Determine Anchor Date (Start of currently selected period)
    let anchorDate = new Date(); // Default to 'now' if all/all

    if (filters.dateFrom) {
      anchorDate = new Date(filters.dateFrom);
      anchorDate.setHours(0, 0, 0, 0);
    } else {
      const currentYear = new Date().getFullYear();
      const y = filters.year !== 'all' ? parseInt(filters.year) : currentYear;

      if (filters.year !== 'all') {
        // If specific year selected, start at month 0 (Jan) unless month is specified
        const m = filters.month !== 'all' ? parseInt(filters.month) : 0;
        anchorDate = new Date(y, m, 1);
      } else {
        // If year is 'all', we default to today as reference point for "previous"
        anchorDate = new Date();
      }
    }

    // 2. Define the 3-month window [StartDate, EndDate)
    const endDate = new Date(anchorDate);
    const startDate = new Date(anchorDate);
    startDate.setMonth(startDate.getMonth() - 3);

    // 3. Filter Records for this specific past window
    const pastRecords = productionRecords.filter(r => {
      const dStr = getStr(r, 'fecha');
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= startDate && d < endDate;
    });

    // 4. Group by Month for Charting
    const grouped = {};
    for (let d = new Date(startDate); d < endDate; d.setMonth(d.getMonth() + 1)) {
      const sortKey = d.toISOString().slice(0, 7);
      // Usar 'es-CL' (o 'es-ES') para meses en español
      const label = d.toLocaleString('es-CL', { month: 'short' });

      grouped[sortKey] = {
        name: label.charAt(0).toUpperCase() + label.slice(1),
        sortKey: sortKey,
        value: 0
      };
    }

    // Aggregate values
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


  // --- DYNAMIC CALCULATIONS ---

  // 1. Dynamic KPIs
  const dynamicKPIs = useMemo(() => {
    const totalCompleted = filteredRecords.reduce((acc, r) => acc + (Number(getVal(r, 'completado')) || Number(getVal(r, 'completado real')) || 0), 0);

    // Default fallback if no records just to show something nice, or empty
    if (productionRecords.length === 0) return initialKpis;

    return [
      { id: 'k1', label: translateText('Producción Total'), value: totalCompleted, unit: 'kg', trend_up: true, subtext: translateText('Enviado a las Plantas Cliente') },
    ];
  }, [filteredRecords, initialKpis, productionRecords]);

  // 2. Production by Plant (Grouped by RESOLVED CLIENT NAME)
  const productionByPlant = useMemo(() => {
    const grouped = {};
    filteredRecords.forEach(r => {
      const plantName = resolveClientName(r);
      const val = Number(getVal(r, 'completado')) || Number(getVal(r, 'completado real')) || 0;

      if (!grouped[plantName]) grouped[plantName] = 0;
      grouped[plantName] += val;
    });

    return Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key]
    })).sort((a, b) => b.value - a.value);
  }, [filteredRecords]); // Eliminamos CLIENT_MAPPING de la dependencia ya que es una constante

  // 3. Production by Client (Also Grouped by RESOLVED CLIENT NAME)
  const productionByClient = useMemo(() => {
    const grouped = {};
    filteredRecords.forEach(r => {
      const clientName = resolveClientName(r);
      const val = Number(getVal(r, 'completado')) || Number(getVal(r, 'completado real')) || 0;

      if (!grouped[clientName]) grouped[clientName] = 0;
      grouped[clientName] += val;
    });

    return Object.entries(grouped)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, vol], index) => ({
        id: name,
        rank: index + 1,
        client_name: name,
        volume_kilos: vol
      }));
  }, [filteredRecords]); // Eliminamos CLIENT_MAPPING de la dependencia ya que es una constante

  // 4. Production by Article (Group by 'articulo')
  const productionByArticle = useMemo(() => {
    const grouped = {};
    filteredRecords.forEach(r => {
      const art = getStr(r, 'articulo') || 'Varios';
      const val = Number(getVal(r, 'completado')) || Number(getVal(r, 'completado real')) || 0;
      if (!grouped[art]) grouped[art] = 0;
      grouped[art] += val;
    });
    return Object.keys(grouped)
      .map(key => ({ name: key, value: grouped[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 articles
  }, [filteredRecords]);


  // Helper constants
  const totalProductionVal = dynamicKPIs.find(k => k.label === 'Producción Total')?.value || 0;
  const totalPlannedForEfficiency = filteredRecords.reduce((acc, r) => acc + (Number(getVal(r, 'planificado')) || Number(getVal(r, 'planificado real')) || 0), 0);
  const totalCompletedForEfficiency = filteredRecords.reduce((acc, r) => acc + (Number(getVal(r, 'completado')) || Number(getVal(r, 'completado real')) || 0), 0);
  const efficiencyVal = totalPlannedForEfficiency > 0 ? (totalCompletedForEfficiency / totalPlannedForEfficiency) * 100 : 0;

  // Total previous production for display
  // const totalPreviousProduction = previousPeriodData.reduce((acc, curr) => acc + curr.value, 0); // Variable no usada visiblemente

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
    <div className="space-y-6 pb-10">

      {/* --- FILTERS --- */}
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

        {/* --- MAIN GRID LAYOUT (12 Columns) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* --- LEFT COLUMN (Span 3): KPI & Trend --- */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* 1. Top Left: KPI Card (Producción Total) */}
            <div className="flex-1 min-h-[180px]">
              {dynamicKPIs.map((kpi) => (
                <Card key={kpi.id} className="h-full bg-slate-950 border-cyan-500/20 shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                  <CardHeader className="pb-2">
                    {/* KPI Title translated */}
                    <CardTitle className="text-cyan-400 font-bold uppercase tracking-wider text-sm">{kpi.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2">
                      <span className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                        {parseFloat(kpi.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <div className="text-xl font-bold text-slate-500 mt-1">{kpi.unit.toUpperCase()}</div>
                    </div>
                    {kpi.subtext && (
                      <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
                        {/* KPI Subtext translated */}
                        {kpi.subtext}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 2. Bottom Left: Last 3 Months Trend */}
            <div className="flex-1 min-h-[250px]">
              <Card className="h-full bg-slate-950 border-purple-500/20 flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4" /> Últimos 3 **Meses**
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
                          <XAxis
                            dataKey="name"
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            tickLine={false}
                            axisLine={{ stroke: '#334155' }}
                            interval={0}
                          />
                          <YAxis
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                            itemStyle={{ color: '#22d3ee' }}
                            formatter={(value) => [`${parseInt(value).toLocaleString()} kg`, 'Volumen']}
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
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <p className="text-xs">Sin datos previos</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* --- CENTER COLUMN (Span 6): Production by Plant --- */}
          <div className="lg:col-span-6 min-h-[500px]">
            <Card className="h-full bg-slate-950 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#06b6d4] text-lg font-bold tracking-wide">Producción por Planta</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Total completado agrupado por planta del holding</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 pt-4">
                {productionByPlant.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productionByPlant} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={true} vertical={true} stroke="#06b6d4" />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        width={140}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                        cursor={{ fill: '#06b6d4', opacity: 0.1 }}
                        formatter={(value) => [`${parseInt(value).toLocaleString()} kg`, 'Volumen']} // Tooltip name translated
                      />
                      <Bar
                        dataKey="value"
                        fill="#06b6d4"
                        radius={[0, 4, 4, 0]}
                        barSize={32}
                        name="Volumen" // Bar name translated
                        label={{ position: 'right', fill: '#fff', fontSize: 12, formatter: (val) => parseInt(val).toLocaleString() }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Sin datos para el periodo seleccionado</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* --- RIGHT COLUMN (Span 3): Map --- */}
          <div className="lg:col-span-3 min-h-[500px]">
            <Card className="h-full bg-slate-950 border-border overflow-hidden flex flex-col">
              <CardHeader className="pb-2 bg-slate-900/50">
                <CardTitle className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <MapIcon className="w-4 h-4" /> Mapa Chile — Producción
                </CardTitle>
              </CardHeader>
              <div className="flex-1 relative bg-slate-900/20">
                <ProductionMap plants={plantsMapData} />
              </div>
            </Card>
          </div>

        </div>
      </section>

      {/* --- SECTION 2: ADDITIONAL CHARTS (Trajectory & Top Clients) --- */}
      <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          {/* ProductionTrajectory component is assumed to handle its own internal translations if needed */}
          <ProductionTrajectory records={productionRecords} clientMapping={CLIENT_MAPPING} />
        </div>

        {/* Top Clients Moved Here to preserve data but respect top layout */}
        <Card className="bg-slate-900/20 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Top Clientes Consolidados</CardTitle>
            <CardDescription>Ranking por volumen de producción</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            <div className="space-y-4">
              {productionByClient.map((client) => (
                <div key={client.id} className="flex items-center justify-between hover:bg-white/5 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${client.rank <= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {client.rank}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{client.client_name}</p>
                      <div className="bg-muted/30 h-1.5 mt-1 rounded-full overflow-hidden w-24">
                        <div
                          className="h-full bg-primary/70 rounded-full"
                          style={{ width: `${(client.volume_kilos / (productionByClient[0]?.volume_kilos || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{parseInt(client.volume_kilos).toLocaleString()} kg</span>
                </div>
              ))}
              {productionByClient.length === 0 && <div className="text-center text-muted-foreground py-10">Sin datos</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/20 border-border flex flex-col justify-center items-center p-6">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-muted/20" />
              <circle
                cx="80" cy="80" r="70"
                stroke="currentColor" strokeWidth="10" fill="transparent"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * efficiencyVal) / 100}
                className={`${parseFloat(efficiencyVal) > 90 ? 'text-emerald-500' : 'text-amber-500'} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{efficiencyVal.toFixed(1)}%</span>
              <span className="text-xs uppercase text-muted-foreground mt-1">Eficiencia</span> {/* Label translated */}
            </div>
          </div>
        </Card>
      </section>

      {/* --- SECTION 3: EXECUTIVE SUMMARY (Dynamic) --- */}
      <section className="space-y-6 pt-8 border-t border-border/50 mt-8">
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="w-5 h-5" />
              Insights Generados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-foreground/80">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span>
                  El volumen total de producción para el periodo seleccionado es de <strong>{parseFloat(totalProductionVal).toLocaleString()} kg</strong>.
                </span>
              </li>
              <li className="flex gap-3 text-sm text-foreground/80">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span>
                  La planta con mayor actividad es <strong>{productionByPlant[0]?.name || 'N/A'}</strong> con un volumen de {parseInt(productionByPlant[0]?.value || 0).toLocaleString()} kg.
                </span>
              </li>
              <li className="flex gap-3 text-sm text-foreground/80">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span>
                  El artículo más producido es <strong>{productionByArticle[0]?.name || 'N/A'}</strong>.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default ProductionReport;