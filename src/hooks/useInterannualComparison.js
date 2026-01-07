import { useMemo } from "react";

export function useInterannualComparison({
    records,
    yearA,
    yearB,
    getVal
}) {
    return useMemo(() => {
        if (!yearA || !yearB) return [];

        const base = Array.from({ length: 12 }, (_, i) => ({
            month: i,
            label: new Date(2000, i).toLocaleString("es-CL", { month: "short" }),
            [yearA]: 0,
            [yearB]: 0
        }));

        records.forEach((r) => {
            // Prefer deriving year/month from a fecha field if available, fallback to explicit fields
            let year = Number(getVal(r, "año"));
            let month = Number(getVal(r, "mes"));
            if ((!year || !month) && r) {
                const raw = r.fecha || r.Fecha || r.date || r.Date;
                if (raw) {
                    const d = new Date(raw);
                    if (!isNaN(d.getTime())) {
                        year = d.getFullYear();
                        month = d.getMonth(); // 0-based
                    }
                }
            }
            const value =
                Number(getVal(r, "completado")) ||
                Number(getVal(r, "completado real")) ||
                0;

            if (Number.isNaN(month) || month < 0 || month > 11) return;

            if (year === Number(yearA)) {
                base[month][yearA] += value;
            }

            if (year === Number(yearB)) {
                base[month][yearB] += value;
            }
        });

        return base;
    }, [records, yearA, yearB, getVal]);
}
