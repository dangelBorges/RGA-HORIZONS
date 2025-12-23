
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useAdminReports = () => {
  const [kpis, setKpis] = useState([]);
  const [sections, setSections] = useState([]);
  const [sidebar, setSidebar] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: kpisData, error: kpisError } = await supabase.from('admin_kpis').select('*');
        if (kpisError) throw kpisError;

        const { data: sectionsData, error: sectionsError } = await supabase.from('admin_sections_v2').select('*').order('sort_order', { ascending: true });
        if (sectionsError) throw sectionsError;

        const { data: sidebarData, error: sidebarError } = await supabase.from('admin_sidebar').select('*');
        if (sidebarError) throw sidebarError;

        setKpis(kpisData || []);
        setSections(sectionsData || []);
        setSidebar(sidebarData || []);
      } catch (error) {
        console.error('Error fetching admin reports:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load admin reports' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);
  return { kpis, sections, sidebar, loading };
};

export const useInventoryReports = () => {
  const [warehouseData, setWarehouseData] = useState([]);
  const [transitData, setTransitData] = useState([]);
  const [inventoryTotal, setInventoryTotal] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // === WAREHOUSE ===
        const { data: warehouse, error: warehouseError } =
          await supabase
            .from("reports_warehouse")
            .select("*")
            .order("last_updated", { ascending: false });

        if (warehouseError) throw warehouseError;

        // 🔥 NORMALIZAR NOMBRES AQUÍ (sin romper nada)
        const warehouseParsed = (warehouse || []).map(row => ({
          ...row,
          codigo: row.articulo,                     // A
          stock_kilos: parseFloat(row.cantidad),    // B
          consumo_promedio: parseFloat(row.consumo_3m), // C
        }));

        // === TRANSIT === (sin cambios)
        const { data: transitRaw, error: transitError } =
          await supabase
            .from("reports_transit")
            .select("*");

        if (transitError) throw transitError;

        const expandTransitRows = () => {
          const all = [];

          transitRaw.forEach(row => {
            for (let i = 1; i <= 6; i++) {
              const oc = row[`oc${i}`];
              const cantidad = row[`cantidad${i}`];
              const eta = row[`eta${i}`];
              const origen = row[`origen${i}`];

              if (oc && cantidad) {
                all.push({
                  id: `${row.id}-${i}`,
                  oc_number: oc,
                  articulo: row.mp,
                  descripcion: row.descripcion,
                  cantidad_kilos: parseFloat(cantidad),
                  eta,
                  origen,
                  status: "En tránsito"
                });
              }
            }
          });

          return all;
        };

        const transitParsed = expandTransitRows();

        // Guardar datos ya normalizados
        setWarehouseData(warehouseParsed);
        setTransitData(transitParsed);

        // === INVENTORY TOTAL (from reports_inventory_total) ===
        try {
          const { data: invTotalRaw, error: invTotalError } = await supabase
            .from('reports_inventory_total')
            .select('*');

          if (invTotalError) throw invTotalError;

          // Normalize fields to expected shape: { mp, descripcion, total }
          const invTotalParsed = (invTotalRaw || []).map(row => {
            const mp = row.mp || row.articulo || row.codigo || '';
            const descripcion = row.descripcion || row.description || row.nombre || '';
            const total = Number(row.total ?? row.total_stock ?? row.total_kilos ?? row.cantidad_total ?? row.cantidad ?? 0) || 0;
            return { mp, descripcion, total, raw: row };
          });

          setInventoryTotal(invTotalParsed);
        } catch (err) {
          console.error('Error fetching reports_inventory_total:', err);
          // don't throw, continue with other data
          setInventoryTotal([]);
        }

      } catch (error) {
        console.error("Error fetching inventory reports:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load inventory reports",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  return { warehouseData, transitData, inventoryTotal, loading };
};





export const useProductionReports = () => {
  const [productionRecords, setProductionRecords] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [vacationList, setVacationList] = useState([]);
  const [plantsMapData, setPlantsMapData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // --- PRODUCTION RECORDS FETCHING ---
        // Implementation: Recursive pagination to bypass Supabase default row limit (usually 1000).
        // We fetch in chunks of 1000 until no more data is returned.

        let allRecords = [];
        let hasMore = true;
        let page = 0;
        const BATCH_SIZE = 1000;

        while (hasMore) {
          const { data, error } = await supabase
            .from('production_records')
            .select('*')
            .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1);

          if (error) throw error;

          if (data && data.length > 0) {
            allRecords = allRecords.concat(data);

            // If the received data is smaller than the batch size, we've reached the end.
            if (data.length < BATCH_SIZE) {
              hasMore = false;
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }

        setProductionRecords(allRecords);


        // --- STATIC / SUMMARY DATA ---
        // These tables are small enough to fetch in a single call.
        const { data: kpisData } = await supabase.from('production_overview_kpis').select('*');
        setKpis(kpisData || []);

        const { data: attData } = await supabase.from('production_attendance_stats').select('*');
        setAttendanceStats(attData || []);

        const { data: vacData } = await supabase.from('production_vacation_list').select('*');
        setVacationList(vacData || []);

        const { data: plantsData } = await supabase.from('production_plants').select('*');
        setPlantsMapData(plantsData || []);

      } catch (error) {
        console.error('Error fetching production reports:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load production reports. Please try again.',
        });
      } finally {
        setLoading(false);
      }

      // --- TOP PRODUCTS (VIEW) ---
      const { data: topProductsData, error: topProductsError } =
        await supabase
          .from('vw_prod_top_products')
          .select('*');

      if (topProductsError) {
        console.error('Error fetching top products:', topProductsError);
      } else {
        setTopProducts(topProductsData || []);
      }

    };



    fetchData();
  }, [toast]);

  return {
    productionRecords,
    kpis,
    attendanceStats,
    vacationList,
    plantsMapData,
    topProducts,
    loading
  };
};
