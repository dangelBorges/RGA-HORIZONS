import { useEffect, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";

const getMonthRange = (year, month) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
    };
};


export const useRawMaterials = ({ year, month }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!year || month === undefined) return;

        const fetchRawMaterials = async () => {
            setLoading(true);
            setError(null);

            const { start, end } = getMonthRange(year, month);

            const { data, error } = await supabase
                .from('raw_material_consumption')
                .select('material_name, total_kg')
                .gte('period', start)
                .lte('period', end)
                .order('total_kg', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Raw materials fetch error:', error);
                setError(error);
            } else {
                setData(data ?? []);
            }

            setLoading(false);
        };

        fetchRawMaterials();
    }, [year, month]);

    return { data, loading, error };
};
