import { useEffect, useState } from "react";
import { supabase } from "@/lib/customSupabaseClient";

/**
 * Supone una tabla:
 * client_production
 * - client_name (text)
 * - year (int)
 * - total_kg (numeric)
 */

export const useClientAnalytics = (year) => {
    const [data, setData] = useState({
        increases: [],
        decreases: [],
        newClients: [],
        lostClients: [],
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!year || year === "all") return;

        const fetchAnalytics = async () => {
            setLoading(true);

            // Año actual
            const { data: current } = await supabase
                .from("client_production")
                .select("client_name, total_kg")
                .eq("year", year);

            // Años anteriores
            const { data: previous } = await supabase
                .from("client_production")
                .select("client_name, total_kg")
                .lt("year", year);

            const prevMap = {};
            previous?.forEach(r => {
                prevMap[r.client_name] =
                    (prevMap[r.client_name] || 0) + Number(r.total_kg);
            });

            const currMap = {};
            current?.forEach(r => {
                currMap[r.client_name] =
                    (currMap[r.client_name] || 0) + Number(r.total_kg);
            });

            const increases = [];
            const decreases = [];
            const newClients = [];
            const lostClients = [];

            // Incrementos / descensos / nuevos
            Object.entries(currMap).forEach(([client, total]) => {
                if (!prevMap[client]) {
                    newClients.push({ client, total });
                } else if (total > prevMap[client]) {
                    increases.push({ client, diff: total - prevMap[client] });
                } else if (total < prevMap[client]) {
                    decreases.push({ client, diff: prevMap[client] - total });
                }
            });

            // Perdidos
            Object.keys(prevMap).forEach(client => {
                if (!currMap[client]) {
                    lostClients.push({ client, total: prevMap[client] });
                }
            });

            setData({
                increases,
                decreases,
                newClients,
                lostClients,
            });

            setLoading(false);
        };

        fetchAnalytics();
    }, [year]);

    return { ...data, loading };
};
