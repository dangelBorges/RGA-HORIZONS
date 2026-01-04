import { useEffect, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";

export function useRawMaterials(period) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from("raw_material_consumption")
                .select("material_nombre, total_kg")
                .eq("period", period)
                .order("total_kg", { ascending: false })
                .limit(10);

            if (!error) {
                setData(data || []);
            }

            setLoading(false);
        };

        fetchData();
    }, [period]);

    return { data, loading };
}
