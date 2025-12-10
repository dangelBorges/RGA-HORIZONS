
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

        const { data: sectionsData, error: sectionsError } = await supabase.from('admin_sections').select('*').order('sort_order', { ascending: true });
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: warehouse, error: warehouseError } = await supabase.from('reports_warehouse').select('*').order('last_updated', { ascending: false });
        if (warehouseError) throw warehouseError;

        const { data: transit, error: transitError } = await supabase.from('reports_transit').select('*').order('eta', { ascending: true });
        if (transitError) throw transitError;

        setWarehouseData(warehouse || []);
        setTransitData(transit || []);
      } catch (error) {
        console.error('Error fetching inventory reports:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load inventory reports' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);
  return { warehouseData, transitData, loading };
};

export const useProductionReports = () => {
  const [productionRecords, setProductionRecords] = useState([]); 
  const [kpis, setKpis] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [vacationList, setVacationList] = useState([]);
  const [plantsMapData, setPlantsMapData] = useState([]);
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
    };

    fetchData();
  }, [toast]);

  return { 
    productionRecords, 
    kpis, 
    attendanceStats, 
    vacationList, 
    plantsMapData,
    loading 
  };
};
