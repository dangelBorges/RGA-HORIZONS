import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { ADMIN_SECTION_MAP } from '@/config/adminSectionMap';



/**
 * ============================
 * ADMIN REPORTS
 * TODO lo que se muestra es EVENTO DEL MES
 * ============================
 */


/* ================================
   Utils
================================ */
const getMonthRange = (month) => {
  if (!month || !month.includes('-')) {
    throw new Error('Invalid month format. Expected YYYY-MM');
  }

  const [year, m] = month.split('-').map(Number);

  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 0);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};


/* ================================
   Hook
================================ */
export const useAdminReports = ({ month } = {}) => {
  const [kpis, setKpis] = useState([]);
  const [sections, setSections] = useState([]);
  const [sidebar, setSidebar] = useState([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    const range = getMonthRange(month);

    // ⛔ NO ejecutar si el mes es inválido
    if (!range) return;

    const { startDate, endDate } = range;

    /* =========================
       Fetch section records
    ========================= */
    const fetchSectionRecords = async (sectionKey, startDate, endDate) => {
      const config = ADMIN_SECTION_MAP[sectionKey];

      if (!config || !config.table) {
        return [];
      }

      // 🔒 BLOQUEO CRÍTICO
      if (!startDate || !endDate) {
        console.warn(
          `[AdminReports] Skipping ${sectionKey}: invalid date range`,
          { startDate, endDate }
        );
        return [];
      }

      const {
        table,
        dateColumn = 'created_at',
        mode = 'events',
      } = config;

      let query = supabase.from(table).select('*');

      if (mode === 'events') {
        query = query
          .gte(dateColumn, startDate)
          .lte(dateColumn, endDate)
          .order(dateColumn, { ascending: false });
      }

      if (mode === 'carry_forward') {
        query = query
          .lte(dateColumn, endDate)
          .order(dateColumn, { ascending: false })
          .limit(1);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error loading ${table}:`, error);
        return [];
      }

      return data || [];
    };



    /* =========================
       Main fetch
    ========================= */
    const fetchData = async () => {
      try {
        setLoading(true);

        /* -------- KPIs -------- */
        const { data: kpisData, error: kpisError } = await supabase
          .from('admin_kpis')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        if (kpisError) throw kpisError;

        /* -------- Sections meta -------- */
        const { data: sectionsMeta, error: sectionsError } = await supabase
          .from('admin_sections_v2')
          .select('*')
          .order('sort_order', { ascending: true });

        if (sectionsError) throw sectionsError;

        /* -------- Sections + records -------- */
        const sectionsWithRecords = await Promise.all(
          (sectionsMeta || []).map(async (section) => ({
            ...section,
            records: await fetchSectionRecords(
              section.section_key,
              startDate,
              endDate
            ),
          }))
        );


        /* -------- Sidebar -------- */
        const { data: sidebarData, error: sidebarError } = await supabase
          .from('admin_sidebar')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: false });

        if (sidebarError) throw sidebarError;

        /* -------- State -------- */
        setKpis(kpisData || []);
        setSections(sectionsWithRecords);
        setSidebar(sidebarData || []);

      } catch (error) {
        console.error('Error fetching admin reports:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar los reportes del mes',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month, toast]);

  return {
    kpis,
    sections,
    sidebar,
    loading,
  };
};




/**
 * ============================
 * INVENTORY REPORTS
 * ============================
 */
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
        const { data: warehouse, error: warehouseError } = await supabase
          .from('reports_warehouse')
          .select('*')
          .order('last_updated', { ascending: false });

        if (warehouseError) throw warehouseError;

        const warehouseParsed = (warehouse || []).map(row => ({
          ...row,
          codigo: row.articulo,
          stock_kilos: parseFloat(row.cantidad),
          consumo_promedio: parseFloat(row.consumo_3m),
        }));

        // === TRANSIT ===
        const { data: transitRaw, error: transitError } = await supabase
          .from('reports_transit')
          .select('*');

        if (transitError) throw transitError;

        const transitParsed = [];
        transitRaw.forEach(row => {
          for (let i = 1; i <= 6; i++) {
            const oc = row[`oc${i}`];
            const cantidad = row[`cantidad${i}`];
            const eta = row[`eta${i}`];
            const origen = row[`origen${i}`];

            if (oc && cantidad) {
              transitParsed.push({
                id: `${row.id}-${i}`,
                oc_number: oc,
                articulo: row.mp,
                descripcion: row.descripcion,
                cantidad_kilos: parseFloat(cantidad),
                eta,
                origen,
                status: 'En tránsito',
              });
            }
          }
        });

        setWarehouseData(warehouseParsed);
        setTransitData(transitParsed);

        // === INVENTORY TOTAL ===
        const { data: invTotalRaw } = await supabase
          .from('reports_inventory_total')
          .select('*');

        const invTotalParsed = (invTotalRaw || []).map(row => ({
          mp: row.mp || row.articulo || row.codigo || '',
          descripcion: row.descripcion || row.nombre || '',
          total: Number(
            row.total ??
            row.total_stock ??
            row.total_kilos ??
            row.cantidad ??
            0
          ),
        }));

        setInventoryTotal(invTotalParsed);
      } catch (error) {
        console.error('Error fetching inventory reports:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load inventory reports',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  return { warehouseData, transitData, inventoryTotal, loading };
};

/**
 * ============================
 * PRODUCTION REPORTS
 * ============================
 */
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
        let allRecords = [];
        let page = 0;
        const BATCH_SIZE = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('production_records')
            .select('*')
            .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1);

          if (error) throw error;

          if (data?.length) {
            allRecords = allRecords.concat(data);
            if (data.length < BATCH_SIZE) hasMore = false;
            else page++;
          } else {
            hasMore = false;
          }
        }

        setProductionRecords(allRecords);

        const { data: kpisData } = await supabase
          .from('production_overview_kpis')
          .select('*');
        setKpis(kpisData || []);

        const { data: attData } = await supabase
          .from('production_attendance_stats')
          .select('*');
        setAttendanceStats(attData || []);

        const { data: vacData } = await supabase
          .from('production_vacation_list')
          .select('*');
        setVacationList(vacData || []);

        const { data: plantsData } = await supabase
          .from('production_plants')
          .select('*');
        setPlantsMapData(plantsData || []);
      } catch (error) {
        console.error('Error fetching production reports:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load production reports',
        });
      } finally {
        setLoading(false);
      }

      const { data: topProductsData } = await supabase
        .from('vw_prod_top_products')
        .select('*');

      setTopProducts(topProductsData || []);
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
    loading,
  };
};
