import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAdminReports } from '@/hooks/useReports';
import {
  Building2,
  Truck,
  Sparkles,
  Thermometer,
  Users,
  Container,
  Wrench,
  Bug,
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
  FlaskConical,
  Palette,
  Beaker
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ---------------- ICON MAP ---------------- */
const iconMap = {
  maintenance_calibration: Wrench,
  vehicle_inspection: Truck,
  general_cleaning: Sparkles,
  environmental_controls: Thermometer,
  supplier_evaluation: Users,
  import_records: Container,
  vehicle_maintenance: Wrench,
  pest_control: Bug,
  action_plans: AlertTriangle,
  internal_audits: ClipboardCheck,
  training_sessions: GraduationCap,
  raw_material_analysis: FlaskConical
};

/* ---------------- TRANSLATIONS ---------------- */
const TRANSLATION_MAP = {
  maintenance_calibration: 'Registros de Mantenimiento y Calibración',
  vehicle_inspection: 'Registros de Revisión de Vehículos',
  general_cleaning: 'Registros de Limpieza General',
  environmental_controls: 'Registros de Controles Ambientales',
  supplier_evaluation: 'Evaluación de Proveedores',
  import_records: 'Registros de Importaciones',
  vehicle_maintenance: 'Mantenimiento de Vehículos',
  pest_control: 'Registros de Control de Plagas',
  action_plans: 'Planes de Acción y Acciones Correctivas',
  internal_audits: 'Auditorías Internas (Trazabilidad)',
  training_sessions: 'Charlas y Capacitaciones',
  raw_material_analysis: 'Análisis de Materia Prima',

  ok: 'OK',
  warning: 'Alerta',
  critical: 'Crítico',
  active: 'Activo',
  completed: 'Completado',
  urgent: 'Urgente'
};

/* ---------------- STATUS COLOR ---------------- */
const getStatusColor = (status) => {
  if (!status) return 'text-muted-foreground font-normal';
  const s = status.toLowerCase();

  if (['conforme', 'cumple', 'realizado', 'ok', 'aprobado', 'terminado', 'completado', 'activo'].includes(s))
    return 'text-emerald-500 font-bold';

  if (['pendiente', 'en proceso', 'pending', 'active'].includes(s))
    return 'text-amber-500 font-bold';

  if (['no conforme', 'rechazado', 'critical', 'urgent'].includes(s))
    return 'text-red-500 font-bold';

  return 'text-foreground font-normal';
};

/* ================= COMPONENT ================= */
const AdminReport = ({ developments = [], formulas = [], openActions = [] }) => {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  const { sections, loading } = useAdminReports({ month: selectedMonth });

  const translateText = (key) => TRANSLATION_MAP[key] || key;

  /* -------- CARD TABLE RENDER -------- */
  const renderCardTable = (title, Icon, headers, rows, headerGradient) => (
    <Card className="overflow-hidden border-border shadow-sm">
      <div className={`h-1 bg-gradient-to-r ${headerGradient}`} />
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-foreground" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1">
        {/* Headers */}
        <div className="flex font-semibold text-sm text-muted-foreground border-b border-border/20 px-2 py-1">
          {headers.map((h, i) => (
            <div key={i} className={h.width || 'flex-1'}>
              {h.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {rows.length === 0 && (
          <div className="px-2 py-3 text-sm text-muted-foreground italic">
            Sin registros
          </div>
        )}

        {rows.map((row, idx) => (
          <div
            key={idx}
            className="flex items-center px-2 py-1 border-b border-border/10 last:border-0"
          >
            {headers.map((h, i) => (
              <div
                key={i}
                className={cn(
                  h.width || 'flex-1',
                  h.statusKey ? getStatusColor(row[h.statusKey]) : ''
                )}
              >
                {h.isColorBox ? (
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: row[h.key] }}
                  />
                ) : (
                  row[h.key] ?? '—'
                )}
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );

  /* -------- LOADING -------- */
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-muted/50 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-muted/30 rounded-lg" />
        </div>
      </div>
    );
  }

  /* ================= RENDER ================= */
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reporte de Gestión Administrativa
          </h1>
        </div>
      </motion.div>

      {/* FILTER */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-muted-foreground font-medium">
          Período:
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-border rounded-md px-3 py-1 text-sm bg-background"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Detalle Operativo</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible>
                {(sections || []).map((section) => {
                  const Icon = iconMap[section.section_key] || Building2;
                  return (
                    <AccordionItem
                      key={section.id}
                      value={section.id}
                      className="border-b border-border last:border-0 px-6"
                    >
                      <AccordionTrigger className="hover:no-underline group">
                        <div className="flex items-center gap-4 w-full">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-semibold text-foreground">
                            {translateText(section.section_key)}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 pb-6 px-4 space-y-2">
                        {section.records && section.records.length > 0 ? (
                          section.records.map((record, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-sm border-b border-border/10 pb-1"
                            >
                              <span className="text-foreground">
                                {record.actividad || record.nombre || record.descripcion || 'Registro'}
                              </span>
                              <span className={getStatusColor(record.estado)}>
                                {record.estado || '—'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground italic">
                            Sin registros para este período
                          </div>
                        )}
                      </AccordionContent>

                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {renderCardTable(
            'Desarrollos',
            Palette,
            [
              { key: 'cliente', label: 'Cliente' },
              { key: 'producto', label: 'Producto' },
              { key: 'color', label: 'Muestra', isColorBox: true, width: 'w-16 text-center' }
            ],
            developments,
            'from-purple-500 to-pink-500'
          )}

          {renderCardTable(
            'Optimización de Fórmulas',
            Beaker,
            [
              { key: 'formula', label: 'Fórmula' },
              { key: 'accion', label: 'Acción' },
              { key: 'costo_inicial', label: 'Costo Inicial' },
              { key: 'costo_final', label: 'Costo Final' }
            ],
            formulas,
            'from-blue-500 to-cyan-500'
          )}

          {renderCardTable(
            'Acciones Abiertas',
            AlertTriangle,
            [
              { key: 'accion', label: 'Acción' },
              { key: 'responsable', label: 'Responsable' },
              { key: 'estado', label: 'Estado', statusKey: 'estado' }
            ],
            openActions,
            'from-orange-500 to-red-500'
          )}
        </div>
      </div>
    </div>
  );
};



export default AdminReport;

