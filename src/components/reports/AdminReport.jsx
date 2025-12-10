import React from 'react';
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
  MessageSquare, 
  GraduationCap, 
  FlaskConical, 
  Droplets,
  Palette,
  Beaker,
  ListTodo
} from 'lucide-react';
import { motion } from 'framer-motion';

// 1. Icon Map (No requiere traducción directa, solo mapeo)
const iconMap = {
  infra: Building2,
  vehicles: Truck,
  cleaning: Sparkles,
  env: Thermometer,
  suppliers: Users,
  imports: Container,
  vehicle_maint: Wrench,
  pests: Bug,
  corrective: AlertTriangle,
  audit: ClipboardCheck,
  talks: MessageSquare,
  training: GraduationCap,
  raw_mat: FlaskConical,
  water: Droplets
};

// 2. Translation Map (Mapeo de las claves de datos a títulos en español)
const TRANSLATION_MAP = {
  infra: 'Mantenimiento de Infraestructura',
  vehicles: 'Control de Vehículos',
  cleaning: 'Programa de Limpieza',
  env: 'Monitoreo Ambiental (H&T)',
  suppliers: 'Evaluación de Proveedores',
  imports: 'Seguimiento de Importaciones',
  vehicle_maint: 'Mantenimiento de Vehículos',
  pests: 'Control de Plagas',
  corrective: 'Acciones Correctivas (ACs)',
  audit: 'Auditorías Internas',
  talks: 'Charlas de Seguridad',
  training: 'Capacitación General',
  raw_mat: 'Recepción de Materia Prima',
  water: 'Análisis de Calidad de Agua',
  ok: 'OK',
  warning: 'Alerta',
  critical: 'Crítico',
  active: 'Activo',
  completed: 'Completado',
  urgent: 'Urgente',
  new_colors: 'Nuevos Colores',
  formulas: 'Modificaciones de Fórmulas',
  open_actions: 'Acciones Abiertas'
};

const AdminReport = () => {
  const { kpis, sections, sidebar, loading } = useAdminReports();

  const translateText = (key) => TRANSLATION_MAP[key] || key;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ok': return 'text-emerald-500';
      case 'warning': return 'text-amber-500';
      case 'critical': return 'text-red-500';
      case 'active': return 'text-primary';
      case 'completed': return 'text-emerald-500';
      case 'urgent': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status) => {
    switch (status?.toLowerCase()) {
      case 'ok': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20';
      case 'critical': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-muted border-border';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-muted/50 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-muted/30 rounded-lg" />)}
          </div>
          <div className="h-96 bg-muted/30 rounded-lg" />
        </div>
      </div>
    );
  }

  // Safety check: ensure sidebar is an array before reducing
  const groupedSidebar = (sidebar || []).reduce((acc, item) => {
    // Usar translateText para traducir la categoría de la barra lateral
    const categoryKey = item.category || 'misc';
    const translatedCategory = translateText(categoryKey);
    
    if (!acc[translatedCategory]) acc[translatedCategory] = [];
    acc[translatedCategory].push(item);
    return acc;
  }, {});
  
  // Obtenemos las categorías para iterar
  const sidebarCategories = Object.keys(groupedSidebar);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reporte Gerencial</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium border border-primary/20">CONFIDENCIAL</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
          {(kpis || []).map((kpi) => (
            <div key={kpi.id} className="bg-card border border-border p-3 rounded-lg text-center shadow-sm">
              {/* Traducción de KPI Label */}
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{translateText(kpi.label?.toLowerCase() || kpi.label)}</div>
              <div className="text-xl font-bold text-foreground">{kpi.value}</div>
              <div className={`text-xs ${kpi.trend === 'up' ? 'text-emerald-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-amber-500'}`}>
                {kpi.change}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Accordions */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Detalle Operativo</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {(sections || []).map((section, index) => {
                  const Icon = iconMap[section.section_key] || Building2;
                  const isCritical = section.status === 'critical';
                  const isWarning = section.status === 'warning';
                  
                  // Traducción del título principal de la sección
                  const translatedTitle = translateText(section.section_key) || section.title;

                  return (
                    <AccordionItem key={section.id} value={section.id} className="border-b border-border last:border-0 px-6">
                      <AccordionTrigger className="hover:no-underline group">
                        <div className="flex items-center gap-4 w-full">
                          <div className={`p-2 rounded-lg transition-colors ${
                            isCritical ? 'bg-red-500/20 text-red-500' : 
                            isWarning ? 'bg-amber-500/20 text-amber-500' : 
                            'bg-primary/10 text-primary group-hover:bg-primary/20'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 text-left">
                            {/* Uso del título traducido */}
                            <span className="font-semibold text-foreground block">{translatedTitle}</span>
                          </div>
                          <div className={`mr-4 px-2 py-0.5 rounded text-xs font-medium border ${getStatusBg(section.status)} ${getStatusColor(section.status)} uppercase`}>
                            {/* Traducción del estado */}
                            {translateText(section.status) || 'N/A'}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-6 px-14">
                        <div className="grid gap-2">
                          {Array.isArray(section.content) && section.content.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                              {/* Asumimos que item.label / item.item puede ser el campo a traducir */}
                              <span className="text-muted-foreground">{translateText(item.label?.toLowerCase() || item.item?.toLowerCase()) || item.label || item.item || 'Detalle'}</span>
                              <span className="font-medium text-foreground">
                                {/* Asumimos que item.status también puede ser un campo a traducir (e.g., 'completed') */}
                                {translateText(item.status?.toLowerCase()) || item.val || item.score || item.result || item.attendance || '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Conclusiones Generales
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                El periodo actual muestra una estabilidad operativa del 94.5%. Se han completado satisfactoriamente los controles de infraestructura y mantenimientos críticos. Se requiere atención especial en las acciones correctivas abiertas y el seguimiento de los lotes de importación pendientes en aduana. El desempeño de proveedores se mantiene en niveles óptimos.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {sidebarCategories.map((category, index) => {
            const items = groupedSidebar[category];
            let IconComponent = ListTodo;
            let titleColor = 'text-orange-500';
            let headerBg = 'from-orange-500 to-red-500';

            if (category === translateText('new_colors')) {
              IconComponent = Palette;
              titleColor = 'text-pink-500';
              headerBg = 'from-purple-500 to-pink-500';
            } else if (category === translateText('formulas')) {
              IconComponent = Beaker;
              titleColor = 'text-cyan-500';
              headerBg = 'from-blue-500 to-cyan-500';
            }

            return (
              <Card key={category} className="overflow-hidden border-border">
                <div className={`h-1 bg-gradient-to-r ${headerBg}`} />
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconComponent className={`w-5 h-5 ${titleColor}`} />
                    {/* Título de la tarjeta traducido */}
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {(items || []).map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                      {category === translateText('open_actions') ? (
                        <AlertTriangle className={`w-4 h-4 mt-0.5 ${getStatusColor(item.status)}`} />
                      ) : (
                        <div className={`w-2 h-2 mt-2 rounded-full ${titleColor.replace('text', 'bg')} shadow-[0_0_10px_rgba(var(--${titleColor.split('-')[1]}),0.5)]`} />
                      )}
                      <div>
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                        {item.status && (
                          <div className={`text-[10px] uppercase font-bold mt-1 ${getStatusColor(item.status)}`}>{translateText(item.status) || item.status}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminReport;