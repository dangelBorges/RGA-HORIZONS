import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
// Se asume que estos componentes existen en la ruta @/components/ui
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Se asume la existencia del hook
import { useInventoryReports } from '@/hooks/useReports';
import {
  Search,
  Download,
  Package,
  Truck,
  AlertTriangle,
  LayoutDashboard,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

// Registrar componentes de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ReporteInventario = () => {
  // Traducir nombres de variables de datos
  const { warehouseData: datosBodega, transitData: datosTransito, inventoryTotal, loading } = useInventoryReports();
  // Traducir estados
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [pestanaActiva, setPestanaActiva] = useState('warehouse');

  // --- Funciones Auxiliares ---

  const calcularDias = (stock, consumoPromedioMensual) => {
    if (!consumoPromedioMensual || consumoPromedioMensual === 0) return 999;
    // Días de suministro (DOS) = Stock / Consumo Diario (Consumo Mensual / 30)
    return Math.round(stock / (consumoPromedioMensual / 30));
  };

  const calcularMeses = (dias) => {
    return (dias / 30).toFixed(1);
  };

  // Formateo seguro de números para evitar errores sobre valores undefined/null
  const formatNumber = (v) => {
    const n = Number(v ?? 0);
    if (Number.isNaN(n)) return '0';
    return n.toLocaleString();
  };

  const obtenerColorEstado = (dias) => {
    if (dias < 45) return 'text-red-500 font-bold';
    if (dias < 90) return 'text-amber-500 font-bold';
    return 'text-emerald-500';
  };

  const exportarACsv = (datos, nombreArchivo) => {
    if (!datos.length) return;

    const encabezados = Object.keys(datos[0]).join(',');
    const filas = datos.map(obj => Object.values(obj).join(','));
    const contenidoCsv = [encabezados, ...filas].join('\n');

    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${nombreArchivo}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- Procesamiento de Datos Memoizado ---

  // 1. Datos de Bodega Procesados
  const datosBodegaProcesados = useMemo(() => {
    return datosBodega
      .map(item => ({
        ...item,
        dias: calcularDias(item.stock_kilos, item.consumo_promedio),
        meses: calcularMeses(calcularDias(item.stock_kilos, item.consumo_promedio))
      }))
      .filter(item =>
        item.descripcion?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
        item.codigo?.toLowerCase().includes(terminoBusqueda.toLowerCase())
      );
  }, [datosBodega, terminoBusqueda]);

  // 2. Datos de Tránsito Agrupados por OC
  const transitosAgrupados = useMemo(() => {
    const grupos = {};

    datosTransito.forEach(item => {
      const oc = item.oc_number;

      if (!grupos[oc]) {
        grupos[oc] = {
          proveedor: item.origen || "N/A",
          eta: item.eta || null,
          items: []
        };
      }

      grupos[oc].items.push({
        id: item.id,
        codigo: item.articulo,
        descripcion: item.descripcion,
        cantidad: item.cantidad_kilos,
        eta: item.eta,
        origen: item.origen,
        status: item.status
      });
    });

    // Ordenamos las OCs por ETA ASC (más próximo arriba)
    const ordenado = Object.fromEntries(
      Object.entries(grupos).sort(([, a], [, b]) => {
        const da = new Date(a.eta);
        const db = new Date(b.eta);
        return da - db;
      })
    );

    // Filtro por búsqueda
    if (terminoBusqueda) {
      Object.keys(ordenado).forEach(key => {
        const match = ordenado[key].items.some(item =>
          item.codigo.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
          item.descripcion.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
          key.toLowerCase().includes(terminoBusqueda.toLowerCase())
        );

        if (!match) delete ordenado[key];
      });
    }

    return ordenado;

  }, [datosTransito, terminoBusqueda]);


  // 3. Datos Totales (preferir tabla `reports_inventory_total` si existe, sino fusionar localmente)
  const datosTotales = useMemo(() => {
    // Si la tabla de totales desde el backend está disponible, úsala como fuente
    if (inventoryTotal && inventoryTotal.length > 0) {
      return inventoryTotal
        .map(item => {
          const codigo = item.mp || item.codigo || item.mp || '';
          const descripcion = item.descripcion || '';
          const total_stock = Number(item.total ?? item.total_stock ?? item.stock_total) || 0;

          // buscar consumo promedio en datosBodega (coincidir por `codigo`)
          const consumo = datosBodega.find(b => b.codigo === codigo || b.articulo === codigo)?.consumo_promedio || 0;

          const dias = consumo > 0 ? Math.round(total_stock / (consumo / 30)) : 999;

          return {
            codigo,
            descripcion,
            stock_total: total_stock,
            dias,
            meses: (dias / 30).toFixed(1)
          };
        })
        .filter(item =>
          item.codigo?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
          item.descripcion?.toLowerCase().includes(terminoBusqueda.toLowerCase())
        );
    }

    // Fallback: calcular a partir de datosBodega + datosTransito (local)
    const mapa = new Map();

    datosBodega.forEach(item => {
      mapa.set(item.codigo, {
        codigo: item.codigo,
        descripcion: item.descripcion,
        consumo_promedio: Number(item.consumo_promedio) || 0,
        stock_bodega: Number(item.stock_kilos) || 0,
        stock_transito: 0
      });
    });

    datosTransito.forEach(item => {
      const codigo = item.articulo;
      const cantidad = Number(item.cantidad_kilos) || 0;

      if (mapa.has(codigo)) {
        mapa.get(codigo).stock_transito += cantidad;
      } else {
        mapa.set(codigo, {
          codigo,
          descripcion: item.descripcion,
          consumo_promedio: 0,
          stock_bodega: 0,
          stock_transito: cantidad
        });
      }
    });

    return Array.from(mapa.values())
      .map(item => {
        const stock_total = item.stock_bodega + item.stock_transito;

        const dias = item.consumo_promedio > 0
          ? Math.round(stock_total / (item.consumo_promedio / 30))
          : 999;

        return {
          codigo: item.codigo,
          descripcion: item.descripcion,
          stock_total,
          dias,
          meses: (dias / 30).toFixed(1)
        };
      })
      .filter(item =>
        item.codigo?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
        item.descripcion?.toLowerCase().includes(terminoBusqueda.toLowerCase())
      );
  }, [inventoryTotal, datosBodega, datosTransito, terminoBusqueda]);



  // --- KPIs (Indicadores Clave de Rendimiento) ---
  const totalKilosTransito = datosTransito.reduce((acc, curr) => acc + parseFloat(curr.cantidad_kilos), 0);
  const itemsCriticos = datosBodegaProcesados.filter(item => item.dias < 90).length;
  const totalRegistros = datosBodegaProcesados.length + datosTransito.length; // Una aproximación, puede ser mejorada

  // --- Datos del Gráfico ---
  const datosGrafico = {
    labels: datosTotales.slice(0, 50).map(i => i.codigo),
    datasets: [
      {
        label: 'Meses de Stock (Total)',
        data: datosTotales.slice(0, 50).map(i => parseFloat(i.meses)),
        backgroundColor: datosTotales.slice(0, 50).map(i =>
          i.dias < 90 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.7)'
        ),
        borderColor: datosTotales.slice(0, 50).map(i =>
          i.dias < 90 ? 'rgb(239, 68, 68)' : 'rgb(16, 185, 129)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: 'var(--foreground)' }
      },
      title: {
        display: true,
        text: 'Top 50 Ítems - Cobertura en Meses',
        color: 'var(--foreground)'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'var(--border)' },
        ticks: { color: 'var(--muted-foreground)' }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'var(--muted-foreground)' }
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted/50 rounded-xl" />)}
        </div>
        <div className="h-96 bg-muted/30 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sección de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-l-primary shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Registros Procesados</p>
                  <h3 className="text-3xl font-bold mt-2">{totalRegistros}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-l-4 border-l-amber-500 shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ítems Críticos (&lt;90 días)</p>
                  <h3 className="text-3xl font-bold mt-2 text-amber-500">{itemsCriticos}</h3>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-l-4 border-l-blue-500 shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total en Tránsito (Kg)</p>
                  <h3 className="text-3xl font-bold mt-2 text-blue-500">{formatNumber(totalKilosTransito)}</h3>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Contenido Principal */}
      <Card className="shadow-md border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Gestión de Inventario
            </CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código o descripción..."
                  className="pl-9"
                  value={terminoBusqueda} // Usar el estado traducido
                  onChange={(e) => setTerminoBusqueda(e.target.value)} // Usar el setter traducido
                />
              </div>
              <Button variant="outline" size="icon" title="Filtro (Mock)">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="warehouse" onValueChange={setPestanaActiva} className="w-full"> {/* Usar el setter traducido */}
            <div className="flex justify-between items-center mb-6">
              <TabsList className="grid w-full md:w-[600px] grid-cols-3">
                <TabsTrigger value="warehouse">Bodega</TabsTrigger>
                <TabsTrigger value="transit">Tránsitos por OC</TabsTrigger>
                <TabsTrigger value="totals">Totales</TabsTrigger>
              </TabsList>

              <Button
                variant="outline"
                className="hidden md:flex gap-2"
                onClick={() => {
                  // Usar estados y funciones traducidas
                  const datosAExportar = pestanaActiva === 'warehouse' ? datosBodegaProcesados :
                    pestanaActiva === 'transit' ? datosTransito : datosTotales;
                  exportarACsv(datosAExportar, `inventario_${pestanaActiva}`);
                }}
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>

            {/* --- SECCION 1: BODEGA --- */}
            <TabsContent value="warehouse" className="space-y-6">
              <div className="rounded-md border border-border overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-medium">
                    <tr>
                      <th className="h-10 px-4 text-left align-middle">Código</th>
                      <th className="h-10 px-4 text-left align-middle">Descripción</th>
                      <th className="h-10 px-4 text-right align-middle">Stock (Kg)</th>
                      <th className="h-10 px-4 text-right align-middle">Consumo (Kg)</th>
                      <th className="h-10 px-4 text-center align-middle">Días</th>
                      <th className="h-10 px-4 text-center align-middle">Meses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {datosBodegaProcesados.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium">{item.codigo}</td>
                        <td className="p-4">{item.descripcion}</td>
                        <td className="p-4 text-right">{formatNumber(item.stock_kilos)}</td>
                        <td className="p-4 text-right">{formatNumber(item.consumo_promedio)}</td>
                        <td className={`p-4 text-center font-bold ${obtenerColorEstado(item.dias)}`}>
                          {item.dias}
                        </td>
                        <td className="p-4 text-center">{item.meses}</td>
                      </tr>
                    ))}
                    {datosBodegaProcesados.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-muted-foreground">
                          No se encontraron resultados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* --- SECCION 2: TRANSITOS --- */}
            <TabsContent value="transit" className="space-y-6">
              <Accordion type="multiple" className="w-full space-y-4">
                {/* Usar el grupo traducido */}
                {Object.entries(transitosAgrupados).map(([numOc, grupo]) => (
                  <AccordionItem key={numOc} value={numOc} className="border border-border rounded-lg px-4 bg-card">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4 pr-4">
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-lg text-primary">{numOc}</span>
                          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                            {grupo.proveedor}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex flex-col md:items-end">
                            <span className="text-muted-foreground text-xs uppercase">ETA Global</span>
                            <span className="font-medium">
                              {grupo.eta ? new Date(grupo.eta).toLocaleDateString() : "—"}
                            </span>

                          </div>
                          <div className="flex flex-col md:items-end">
                            <span className="text-muted-foreground text-xs uppercase">Items</span>
                            <span className="font-medium">{grupo.items.length}</span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="rounded-md border border-border mt-2 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/30 text-muted-foreground">
                            <tr>
                              <th className="py-2 px-4 text-left font-medium">Código</th>
                              <th className="py-2 px-4 text-left font-medium">Descripción</th>
                              <th className="py-2 px-4 text-right font-medium">Cantidad (Kg)</th>
                              <th className="py-2 px-4 text-right font-medium">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50 bg-card/50">
                            {grupo.items.map((item, i) => (
                              <tr key={item.id || i} className="hover:bg-muted/20">
                                <td className="py-2 px-4 font-medium">{item.codigo}</td>
                                <td className="py-2 px-4">{item.descripcion}</td>

                                <td className="py-2 px-4 text-right font-bold">
                                  {formatNumber(item.cantidad)} kg
                                </td>

                                <td className="py-2 px-4 text-center">
                                  <span className="text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {item.status}
                                  </span>
                                </td>

                                <td className="py-2 px-4 text-center text-sm text-muted-foreground">
                                  {item.origen}
                                </td>

                                <td className="py-2 px-4 text-center text-sm">
                                  {item.eta ? new Date(item.eta).toLocaleDateString() : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>

                        </table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {Object.keys(transitosAgrupados).length === 0 && (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                  No se encontraron tránsitos activos con los criterios de búsqueda.
                </div>
              )}
            </TabsContent>

            {/* --- SECCION 3: TOTALES --- */}
            <TabsContent value="totals" className="space-y-6">
              <div className="rounded-md border border-border overflow-x-auto max-h-[500px] overflow-y-auto mb-8">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-medium">
                    <tr>
                      <th className="h-10 px-4 text-left align-middle">Código</th>
                      <th className="h-10 px-4 text-left align-middle">Descripción</th>
                      <th className="h-10 px-4 text-right align-middle">Stock Total</th>
                      <th className="h-10 px-4 text-right align-middle">Dias</th>
                      <th className="h-10 px-4 text-right align-middle">Meses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {datosTotales.map((item) => (
                      <tr key={item.codigo} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium">{item.codigo}</td>
                        <td className="p-4">{item.descripcion}</td>
                        <td className="p-4 text-right">{formatNumber(item.stock_total)}</td>
                        <td className={`p-4 text-center font-bold ${obtenerColorEstado(item.dias)}`}>
                          {item.dias}
                        </td>
                        <td className="p-4 text-center">{item.meses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="h-[400px] w-full bg-card p-4 rounded-xl border border-border">
                {/* Usar datosGrafico y opcionesGrafico traducidos */}
                <Bar data={datosGrafico} options={opcionesGrafico} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReporteInventario;