// components/reports/admin/AccionesAbiertasTable.jsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getStatusColorClass } from '@/utils/statusColors';

const AccionesAbiertasTable = ({ data = [] }) => {
    return (
        <Card className="overflow-hidden border-border shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle>Acciones Abiertas</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-muted/20">
                            <th className="text-left px-3 py-2">Acción</th>
                            <th className="text-left px-3 py-2">Responsable</th>
                            <th className="text-left px-3 py-2">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, idx) => (
                            <tr key={idx} className="border-b border-border/30 last:border-0">
                                <td className="px-3 py-2">{item.accion}</td>
                                <td className="px-3 py-2">{item.responsable}</td>
                                <td className={`px-3 py-2 ${getStatusColorClass(item.estado)}`}>{item.estado}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
};

export default AccionesAbiertasTable;
