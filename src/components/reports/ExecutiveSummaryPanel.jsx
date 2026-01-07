import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  FileText
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const ExecutiveSummaryPanel = ({
  totalProduction,
  efficiency,
  totalAttendance,
  totalAbsences,
  interannualVariation, // % number (puede ser null)
  activeClients,
  newClients = 0,
  lostClients = 0,
  growingClients = 0,
  decliningClients = 0
}) => {
  const isPositiveVariation = interannualVariation >= 0;

  return (
    <Card className="bg-card border-primary/20 overflow-hidden relative">
      {/* Decorative icon */}
      <div className="absolute top-0 right-0 p-3 opacity-20">
        <FileText className="w-24 h-24 text-primary" />
      </div>

      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="text-lg text-primary flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Resumen Ejecutivo Mensual
        </CardTitle>
        <CardDescription>
          Indicadores clave de desempeño y alertas relevantes
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6">
        {/* ================= KPIs CLAVE ================= */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background/40 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
            <span className="text-xs text-muted-foreground block mb-1">
              Producción total
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">
                {Number(totalProduction).toLocaleString()}
              </span>
              <span className="text-xs font-mono text-primary">kg</span>
            </div>
          </div>

          <div className="bg-background/40 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
            <span className="text-xs text-muted-foreground block mb-1">
              Variación interanual
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`text-xl font-bold ${isPositiveVariation ? "text-emerald-500" : "text-red-400"
                  }`}
              >
                {interannualVariation != null
                  ? `${interannualVariation}%`
                  : "—"}
              </span>
              {interannualVariation != null &&
                (isPositiveVariation ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ))}
            </div>
          </div>

          <div className="bg-background/40 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
            <span className="text-xs text-muted-foreground block mb-1">
              Clientes activos
            </span>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-xl font-bold text-foreground">
                {activeClients}
              </span>
            </div>
          </div>

          <div className="bg-background/40 p-3 rounded-lg border border-white/5 backdrop-blur-sm">
            <span className="text-xs text-muted-foreground block mb-1">
              Eficiencia global
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-emerald-500">
                {efficiency}
              </span>
            </div>
          </div>
        </div>

        {/* ================= ALERTAS ================= */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
          <h4 className="text-xs font-bold uppercase text-primary mb-3">
            Alertas y observaciones
          </h4>

          <ul className="space-y-2">
            {lostClients > 0 && (
              <li className="text-sm flex items-start gap-2 text-muted-foreground">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                <span>
                  Se detectaron <strong>{lostClients}</strong> clientes
                  perdidos en el período analizado.
                </span>
              </li>
            )}

            {growingClients > 0 && (
              <li className="text-sm flex items-start gap-2 text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>
                  <strong>{growingClients}</strong> clientes muestran aumento
                  sostenido de demanda.
                </span>
              </li>
            )}

            {interannualVariation != null && interannualVariation < 0 && (
              <li className="text-sm flex items-start gap-2 text-muted-foreground">
                <TrendingDown className="w-4 h-4 text-amber-500 mt-0.5" />
                <span>
                  La producción total presenta una caída interanual que requiere
                  revisión.
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* ================= MOVIMIENTO CLIENTES ================= */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between p-2 rounded bg-muted/20">
            <span>Clientes nuevos</span>
            <span className="font-mono text-emerald-500">
              {newClients}
            </span>
          </div>

          <div className="flex justify-between p-2 rounded bg-muted/20">
            <span>Clientes perdidos</span>
            <span className="font-mono text-red-400">
              {lostClients}
            </span>
          </div>

          <div className="flex justify-between p-2 rounded bg-muted/20">
            <span>En crecimiento</span>
            <span className="font-mono text-emerald-500">
              {growingClients}
            </span>
          </div>

          <div className="flex justify-between p-2 rounded bg-muted/20">
            <span>En disminución</span>
            <span className="font-mono text-amber-500">
              {decliningClients}
            </span>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] text-muted-foreground/50 uppercase">
            Última actualización: datos consolidados
          </span>
          <button className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors">
            Ver detalle completo <FileText className="w-3 h-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutiveSummaryPanel;
