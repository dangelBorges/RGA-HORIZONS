import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { BarChart3, Package, FolderKanban } from 'lucide-react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import AdminReport from '@/components/reports/AdminReport';
import ProductionReport from '@/components/reports/ProductionReport';
import InventoryReport from '@/components/reports/InventoryReport';

function App() {
  return (
    <ThemeProvider>
      <Helmet>
        <title>Panel de Control Corporativo - Inteligencia de Negocios</title>
        <meta name="description" content="Panel de análisis corporativo integral con informes de administración, producción e inventario." />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Tabs defaultValue="admin" className="w-full">
              {/* Barra de Pestañas (Menú) */}
              <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8">
                
                {/* Pestaña 1: Administración */}
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Administración</span>
                  <span className="sm:hidden">Admin</span>
                </TabsTrigger>
                
                {/* Pestaña 2: Producción */}
                <TabsTrigger value="production" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">Producción</span>
                  <span className="sm:hidden">Prod</span>
                </TabsTrigger>
                
                {/* Pestaña 3: Inventario */}
                <TabsTrigger value="inventory" className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4" />
                  <span className="hidden sm:inline">Inventario</span>
                  <span className="sm:hidden">Inv</span>
                </TabsTrigger>

              </TabsList>

              {/* Contenido de las pestañas */}
              <TabsContent value="admin">
                <AdminReport />
              </TabsContent>

              <TabsContent value="production">
                <ProductionReport />
              </TabsContent>

              <TabsContent value="inventory">
                <InventoryReport />
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>

        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;