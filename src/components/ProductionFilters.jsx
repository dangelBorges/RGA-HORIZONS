
import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Filter, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductionFilters = ({ filters, onFilterChange, availableYears = [] }) => {
  const months = [
    { value: 'all', label: 'Todos los Meses' },
    { value: '0', label: 'Enero' }, { value: '1', label: 'Febrero' }, 
    { value: '2', label: 'Marzo' }, { value: '3', label: 'Abril' },
    { value: '4', label: 'Mayo' }, { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' }, { value: '7', label: 'Agosto' },
    { value: '8', label: 'Septiembre' }, { value: '9', label: 'Octubre' },
    { value: '10', label: 'Noviembre' }, { value: '11', label: 'Diciembre' }
  ];

  // Use passed availableYears or fallback to a default list if data isn't ready yet
  const yearsToDisplay = availableYears.length > 0 
    ? ['all', ...availableYears] 
    : ['all', new Date().getFullYear().toString()];

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <Card className="bg-[#0f172a]/80 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-6 items-end">
            
            {/* Header Icon */}
            <div className="hidden lg:flex items-center gap-2 mb-2 text-cyan-400">
              <Filter className="w-5 h-5" />
              <span className="font-bold text-sm tracking-wider uppercase">Filtros</span>
            </div>

            {/* Year Selector */}
            <div className="w-full lg:w-40 space-y-2">
              <Label className="text-xs text-slate-400">Año</Label>
              <Select value={filters.year} onValueChange={(val) => handleChange('year', val)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200 h-9">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Month Selector */}
            <div className="w-full lg:w-48 space-y-2">
              <Label className="text-xs text-slate-400">Mes</Label>
              <Select value={filters.month} onValueChange={(val) => handleChange('month', val)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200 h-9">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            

            <div className="flex-1 text-right hidden lg:block">
              <span className="text-[10px] text-cyan-500/50 uppercase font-mono">
                System Status: Online
              </span>
            </div>

          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProductionFilters;
