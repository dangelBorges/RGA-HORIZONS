import React from "react";

const ClientRankItem = ({ client = {}, maxVolume = 1 }) => {
  const { name = client.client || "Sin nombre", volume_kilos = client.volume_kilos || 0 } = client;
  const pct = Math.round((volume_kilos / Math.max(maxVolume, 1)) * 100);

  return (
    <div className="flex items-center justify-between py-2">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{name}</div>
        <div className="text-xs text-muted-foreground">{volume_kilos.toLocaleString()} kg</div>
      </div>
      <div className="ml-4 text-sm text-muted-foreground">{pct}%</div>
    </div>
  );
};

export default React.memo(ClientRankItem);
