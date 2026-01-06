import React from "react";
import { FileText, Activity, Target, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ExecutiveSummary = ({ totalProduction = 0, efficiency = "0%", totalAbsences = 0, totalAttendance = 0 }) => (
    <Card className="bg-card border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-3 opacity-20">
            <FileText className="w-24 h-24 text-primary" />
        </div>
        <CardHeader className="relative z-10 pb-4">
            <CardTitle className="text-lg text-primary flex items-center gap-2">
                <Activity className="w-5 h-5" /> Resumen Ejecutivo Mensual
            </CardTitle>
            <CardDescription>Consolidado de KPIs Críticos y Eficiencia</CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
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
                <button className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors">Ver Reporte Completo <FileText className="w-3 h-3" /></button>
            </div>
        </CardContent>
    </Card>
);

export default React.memo(ExecutiveSummary);
