import { useMemo } from "react";

export function useExecutiveSummary({ records, getStr, getVal }) {
    return useMemo(() => {
        if (!records || records.length === 0) {
            return {
                periodLabel: null,
                totalProduction: 0,
                interannualVariation: null,
                activeClients: 0,
                newClients: 0,
                lostClients: 0,
                growingClients: 0,
                decliningClients: 0
            };
        }

        // 1️⃣ Normalizar
        const normalized = records
            .map((r) => {
                const dStr = getStr(r, "fecha");
                if (!dStr) return null;

                const d = new Date(dStr);
                if (isNaN(d.getTime())) return null;

                return {
                    _year: d.getFullYear(),
                    _month: d.getMonth(),
                    client: getVal(r, "cliente"),
                    value:
                        Number(getVal(r, "total_kg")) ||
                        Number(getVal(r, "kg")) ||
                        Number(getVal(r, "completado")) ||
                        Number(getVal(r, "completado real")) ||
                        Number(getVal(r, "produccion")) ||
                        0
                };
            })
            .filter(r => r && r.client);

        if (normalized.length === 0) return null;

        // 2️⃣ Último período real
        const last = normalized.reduce((a, b) => {
            if (
                !a ||
                b._year > a._year ||
                (b._year === a._year && b._month > a._month)
            ) return b;
            return a;
        }, null);

        const year = last._year;
        const month = last._month;
        const lastYear = last._year;
        const lastMonth = last._month;

        const periodLabel = `${new Date(lastYear, lastMonth).toLocaleString("es-CL", {
            month: "long"
        })} ${lastYear}`;


        // 3️⃣ Resolver período anterior correctamente
        const prevMonth =
            month === 0 ? 11 : month - 1;
        const prevMonthYear =
            month === 0 ? year - 1 : year;

        // 4️⃣ Períodos
        const current = normalized.filter(
            r => r._year === year && r._month === month
        );

        const prev = normalized.filter(
            r => r._year === prevMonthYear && r._month === prevMonth
        );

        const lastYearSameMonth = normalized.filter(
            r => r._year === year - 1 && r._month === month
        );


        // 5️⃣ Producción
        const sum = arr => arr.reduce((a, r) => a + r.value, 0);

        const totalProduction = sum(current);
        const lastYearProduction = sum(lastYearSameMonth);

        const interannualVariation =
            lastYearProduction > 0
                ? Number(
                    ((totalProduction - lastYearProduction) /
                        lastYearProduction) * 100
                ).toFixed(1)
                : null;

        // 6️⃣ Clientes
        const currentClients = new Set(current.map(r => r.client));
        const prevClients = new Set(prev.map(r => r.client));

        const activeClients = currentClients.size;

        const newClients = [...currentClients].filter(
            c => !prevClients.has(c)
        ).length;

        const lostClients = [...prevClients].filter(
            c => !currentClients.has(c)
        ).length;

        // 7️⃣ Crecimiento / disminución
        const sumByClient = arr => {
            const map = {};
            arr.forEach(r => {
                map[r.client] = (map[r.client] || 0) + r.value;
            });
            return map;
        };

        const currMap = sumByClient(current);
        const prevMap = sumByClient(prev);

        let growingClients = 0;
        let decliningClients = 0;

        Object.keys(currMap).forEach(client => {
            if (!prevMap[client]) return;

            if (currMap[client] > prevMap[client]) growingClients++;
            if (currMap[client] < prevMap[client]) decliningClients++;
        });

        // 8️⃣ Insight principal
        let mainInsight = "No hay información suficiente para generar comparaciones.";

        if (interannualVariation !== null) {
            const v = Number(interannualVariation);

            if (v > 0) {
                mainInsight = `La producción creció un ${v}% en comparación al mismo mes del año anterior.`;
            } else if (v < 0) {
                mainInsight = `La producción cayó un ${Math.abs(v)}% respecto al mismo mes del año anterior.`;
            } else {
                mainInsight = "La producción se mantuvo estable respecto al año anterior.";
            }
        }

        // 9️⃣ Alerta
        let alert = null;

        if (interannualVariation !== null && Number(interannualVariation) < -5) {
            alert = "Caída interanual relevante en la producción.";
        } else if (lostClients > newClients) {
            alert = "Se perdieron más clientes de los que se incorporaron este mes.";
        } else if (decliningClients > growingClients) {
            alert = "Más clientes redujeron su volumen que los que crecieron.";
        }

        // 🔟 Observaciones
        let observations = [];

        if (newClients > 0) {
            observations.push(`Se incorporaron ${newClients} clientes nuevos.`);
        }

        if (lostClients > 0) {
            observations.push(`Se perdieron ${lostClients} clientes respecto al mes anterior.`);
        }

        if (growingClients > decliningClients && growingClients > 0) {
            observations.push("La mayoría de los clientes comparables aumentó su volumen.");
        }

        if (decliningClients > growingClients && decliningClients > 0) {
            observations.push("Predomina una disminución de volumen en clientes activos.");
        }

        if (observations.length === 0) {
            observations.push("La cartera de clientes se mantiene estable.");
        }

        return {
            periodLabel,
            totalProduction,
            interannualVariation,
            activeClients,
            newClients,
            lostClients,
            growingClients,
            decliningClients,
            mainInsight,
            alert,
            observations
        };

    }, [records, getStr, getVal]);
}
