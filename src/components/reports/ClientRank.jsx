import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import ClientRankItem from "@/components/reports/ui/ClientRankItem";

export default function ClientRank({ productionByClient = [], maxVolume }) {
  return (
    <div className="lg:col-span-3 h-[500px]">
      <Card className="h-full bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Top Clientes Consolidados</CardTitle>
          <CardDescription>Ranking por volumen</CardDescription>
        </CardHeader>

        <CardContent className="overflow-y-auto pr-2 p-3 scrollbar-thin">
          {productionByClient.length > 0 ? (
            productionByClient.map((client) => (
              <ClientRankItem
                client={client}
                key={client.id}
                maxVolume={maxVolume || productionByClient[0]?.volume_kilos || 1}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground py-6">Sin datos</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
