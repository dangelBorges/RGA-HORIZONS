import { useMemo } from "react";

export function useExecutiveSummary({
    records,
    getStr,
    getVal
}) {
    return useMemo(() => {
        if (!records || records.length === 0) {
            return {
                periodLabel: null,
                totalProduction: 0,
                interannualVariation: null,
                activeClients: 0
            };
        }

        // 1️⃣ Normalizar fechas
        const normalized = records
            .map((r) => {
                const dStr = getStr(r, "fecha");
                if (!dStr) return null;

                const d = new Date(dStr);
                if (isNaN(d.getTime())) return null;

                return {
                    ...r,
                    _year: d.getFullYear(),
                    _month: d.getMonth()
                };
            })
            .filter(Boolean);

        if (normalized.length === 0) {
            return {
                periodLabel: null,
                totalProduction: 0,
                interannualVariation: null,
                activeClients: 0
            };
        }

        // 2️⃣ Detectar último período disponible
        const last = normalized.reduce((acc, r) => {
            if (
                !acc ||
                r._year > acc._year ||
                (r._year === acc._year && r._month > acc._month)
            ) {
                return r;
            }
            return acc;
        }, null);

        const lastYear = last._year;
        const lastMonth = last._month;

        // 3️⃣ Filtrar períodos
        const currentPeriod = normalized.filter(
            (r) => r._year === lastYear && r._month === lastMonth
        );

        const prevMonthPeriod = normalized.filter(
            (r) =>
                r._year === lastYear &&
                r._month === lastMonth - 1
        );

        const lastYearSameMonth = normalized.filter(
            (r) =>
                r._year === lastYear - 1 &&
                r._month === lastMonth
        );

        // 4️⃣ Suma defensiva de producción
        const sumProduction = (arr) =>
            arr.reduce((acc, r) => {
                const value =
                    Number(getVal(r, "total_kg")) ||
                    Number(getVal(r, "kg")) ||
                    Number(getVal(r, "completado")) ||
                    Number(getVal(r, "completado real")) ||
                    Number(getVal(r, "produccion")) ||
                    0;

                return acc + value;
            }, 0);

        const totalProduction = sumProduction(currentPeriod);
        const prevMonthProduction = sumProduction(prevMonthPeriod);
        const lastYearProduction = sumProduction(lastYearSameMonth);

        const interannualVariation =
            lastYearProduction > 0
                ? Number(
                    ((totalProduction - lastYearProduction) /
                        lastYearProduction) *
                    100
                ).toFixed(1)
                : null;

        const activeClients = new Set(
            currentPeriod.map((r) => getVal(r, "cliente"))
        ).size;

        return {
            periodLabel: `${new Date(lastYear, lastMonth).toLocaleString("es-CL", {
                month: "long"
            })} ${lastYear}`,
            totalProduction,
            interannualVariation,
            activeClients
        };
    }, [records, getStr, getVal]);
}
