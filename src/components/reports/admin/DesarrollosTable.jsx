// components/reports/admin/DesarrollosTable.jsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getStatusColorClass } from '@/utils/statusColors';

const DesarrollosTable = ({ data = [] }) => {
    return (
        <Card className="overflow-hidden border-border shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle>Desarrollos</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-muted/20">
                            <th className="text-left px-3 py-2">Cliente</th>
                            <th className="text-left px-3 py-2">Producto</th>
                            <th className="text-left px-3 py-2">Muestra</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, idx) => (
                            <tr key={idx} className="border-b border-border/30 last:border-0">
                                <td className="px-3 py-2">{item.cliente}</td>
                                <td className="px-3 py-2">{item.producto}</td>
                                <td className="px-3 py-2">
                                    <div
                                        className="w-5 h-5 border rounded"
                                        style={{ backgroundColor: item.color || '#fff' }}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
};

export default DesarrollosTable;
