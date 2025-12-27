
import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Filter, MousePointerClick } from 'lucide-react';

const COLORS = [
  '#22d3ee', // Cyan-400
  '#e879f9', // Fuchsia-400
  '#fbbf24', // Amber-400
  '#60a5fa', // Blue-400
  '#a78bfa', // Violet-400
  '#f472b6', // Pink-400
  '#34d399', // Emerald-400
  '#fb923c', // Orange-400
  '#818cf8', // Indigo-400
  '#a3e635', // Lime-400
];

const ProductionTrajectory = ({ records, clientMapping }) => {
  // Changed default year to '2025' as requested
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('all');

  // State for interactivity: which plant is currently focused/highlighted
  const [focusedPlant, setFocusedPlant] = useState(null);

  // --- HELPER: Resolve Client Name ---
  const getStr = (r, key) => {
    if (!r) return '';
    return r[key] || r[key.charAt(0).toUpperCase() + key.slice(1)] || '';
  };

  const resolveClientName = (r) => {
    const code = r['CveCliente'] || r['cvecliente'] || r['cveCliente'] || r['CVE_CLIENTE'];
    if (code) {
      const cleanCode = code.toString().trim();
      if (clientMapping && clientMapping[cleanCode]) {
        return clientMapping[cleanCode];
      }
    }
    const rawName = getStr(r, 'cliente');
    return rawName || 'Sin Cliente';
  };

  // --- 1. EXTRACT OPTIONS ---
  const { years, months } = useMemo(() => {
    if (!records) return { years: [], months: [] };
    const ySet = new Set();
    records.forEach(r => {
      const d = new Date(getStr(r, 'fecha'));
      if (!isNaN(d.getTime())) ySet.add(d.getFullYear());
    });

    // Static months list
    const mList = [
      { value: '0', label: 'Enero' }, { value: '1', label: 'Febrero' },
      { value: '2', label: 'Marzo' }, { value: '3', label: 'Abril' },
      { value: '4', label: 'Mayo' }, { value: '5', label: 'Junio' },
      { value: '6', label: 'Julio' }, { value: '7', label: 'Agosto' },
      { value: '8', label: 'Septiembre' }, { value: '9', label: 'Octubre' },
      { value: '10', label: 'Noviembre' }, { value: '11', label: 'Diciembre' }
    ];

    return {
      years: Array.from(ySet).sort((a, b) => b - a),
      months: mList
    };
  }, [records]);

  // --- 2. PROCESS CHART DATA ---
  const { chartData, plantNames } = useMemo(() => {
    if (!records || records.length === 0) return { chartData: [], plantNames: [] };

    // A. Filter Data
    const filtered = records.filter(r => {
      const dStr = getStr(r, 'fecha');
      if (!dStr) return false;
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return false;

      if (selectedYear !== 'all' && d.getFullYear().toString() !== selectedYear) return false;
      if (selectedMonth !== 'all' && d.getMonth().toString() !== selectedMonth) return false;
      return true;
    });

    // B. Grouping Strategy
    const groupingMap = {};
    const plantsSet = new Set();

    filtered.forEach(r => {
      const d = new Date(getStr(r, 'fecha'));
      const plant = resolveClientName(r);
      plantsSet.add(plant);

      const val = Number(r['completado'] || r['Completado'] || r['completado real'] || r['Completado real'] || 0);

      let key, label, sortKey;

      if (selectedYear === 'all') {
        // Group by Year
        key = d.getFullYear().toString();
        label = key;
        sortKey = d.getFullYear();
      } else if (selectedMonth === 'all') {
        // Group by Month
        key = d.getMonth().toString();
        label = d.toLocaleString('es-ES', { month: 'short' });
        label = label.charAt(0).toUpperCase() + label.slice(1);
        sortKey = d.getMonth();
      } else {
        // Group by Day
        key = d.getDate().toString();
        label = d.getDate().toString();
        sortKey = d.getDate();
      }

      if (!groupingMap[key]) {
        groupingMap[key] = { name: label, sortKey, originalKey: key };
      }
      if (!groupingMap[key][plant]) {
        groupingMap[key][plant] = 0;
      }
      groupingMap[key][plant] += val;
    });

    // C. Convert to Array and Sort
    const finalData = Object.values(groupingMap).sort((a, b) => a.sortKey - b.sortKey);
    const finalPlants = Array.from(plantsSet).sort();

    return { chartData: finalData, plantNames: finalPlants };

  }, [records, selectedYear, selectedMonth, clientMapping]);

  // --- INTERACTION HANDLERS ---
  const handleLegendClick = (e) => {
    // Recharts Legend 'onClick' passes the payload, where 'value' is the name/dataKey
    const plantName = e.value;
    setFocusedPlant(prev => prev === plantName ? null : plantName);
  };

  return (
    <Card className="border-border bg-card shadow-lg">
      <div className="flex flex-col lg:flex-row h-full">

        {/* Left Control Panel */}
        <div className="w-full lg:w-1/4 p-6 border-b lg:border-b-0 lg:border-r border-border bg-card flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-bold text-lg text-primary">Trayectoria por planta</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Visualiza la evolución de producción histórica. Filtra para detallar la vista.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Filter className="w-3 h-3" /> Año
              </label>
              <select
                className="w-full bg-card border border-slate-700 text-blue-700 text-sm rounded-md p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  if (e.target.value === 'all') setSelectedMonth('all'); // Reset month if year is all
                }}
              >
                <option value="all">Todos (Histórico)</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Filter className="w-3 h-3" /> Mes
              </label>
              <select
                className="w-full bg-card border border-slate-700 text-blue-700 text-sm rounded-md p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={selectedYear === 'all'}
              >
                <option value="all">Todos</option>
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Hint */}
          <div className="bg-card p-3 rounded-md border border-slate-700/50 mt-2">
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <MousePointerClick className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p>
                Tip: Haz clic en el nombre de una planta en la leyenda para resaltar su línea.
              </p>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Total Plantas:</span>
              <span className="font-mono text-slate-300">{plantNames.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Puntos de datos:</span>
              <span className="font-mono text-slate-300">{chartData.length}</span>
            </div>
          </div>
        </div>

        {/* Right Chart Area */}
        <div className="w-full lg:w-3/4 p-4 lg:p-6 h-[520px] lg:h-[600px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                  formatter={(value) => [`${value.toLocaleString()} kg`, '']}
                  labelStyle={{ marginBottom: '8px', fontWeight: 'bold', color: '#cbd5e1' }}
                />

                {/* Interactive Legend */}
                <Legend
                  verticalAlign="bottom"
                  height={320}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px', cursor: 'pointer' }}
                  onClick={handleLegendClick}
                  formatter={(value, entry) => {
                    const isDimmed = focusedPlant && focusedPlant !== value;
                    return (
                      <span
                        className={`ml-1 text-sm ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
                        style={{ fontWeight: focusedPlant === value ? 600 : 400 }}
                      >
                        {value}
                      </span>
                    );
                  }}
                />

                {plantNames.map((plant, index) => {
                  // Interaction Logic
                  const isFocused = focusedPlant === plant;
                  const isDimmed = focusedPlant && !isFocused;

                  return (
                    <Line
                      key={plant}
                      type="monotone"
                      dataKey={plant}
                      name={plant}
                      stroke={COLORS[index % COLORS.length]}
                      // Dynamic styling based on focus state
                      strokeWidth={isFocused ? 5 : 3}
                      strokeOpacity={isDimmed ? 0.15 : 1}
                      // Only show dots for focused line to reduce clutter, or default if none focused
                      dot={isFocused ? { r: 4, strokeWidth: 0 } : false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls
                      animationDuration={500}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
              <p>No hay datos disponibles para la selección actual.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProductionTrajectory;
