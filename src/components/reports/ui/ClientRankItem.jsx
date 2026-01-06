import React from "react";

const ClientRankItem = ({ client = {}, maxVolume = 1 }) => (
    <div
        key={client.id}
        className="flex items-center justify-between mb-3 p-2 rounded-lg bg-white/5 hover:bg-white/10"
    >
        <div className="flex items-center gap-3">
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${client.rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
            >
                {client.rank}
            </div>
            <div>
                <p className="text-sm font-medium">{client.client_name}</p>
                <div className="bg-muted/30 h-1.5 mt-1 rounded-full overflow-hidden w-24">
                    <div
                        className="h-full bg-primary/70 rounded-full"
                        style={{
                            width: `${(client.volume_kilos / (maxVolume || 1)) * 100}%`,
                        }}
                    />
                </div>
            </div>
        </div>
        <span className="text-sm font-mono text-muted-foreground">{parseInt(client.volume_kilos).toLocaleString()} kg</span>
    </div>
);

export default React.memo(ClientRankItem);
