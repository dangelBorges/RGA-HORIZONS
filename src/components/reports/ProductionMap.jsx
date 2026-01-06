import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";

// Note: Leaflet CSS must be imported for the map to render correctly.
// The dark theme is achieved via CartoDB Dark Matter tiles.

const ProductionMap = ({ plants }) => {
  const center = [-33.4489, -70.6693]; // Santiago center approx

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="h-full bg-card border-border shadow-lg">
        <CardContent className="p-0 relative h-[450px]">
          {/* Custom Header similar to the Trend Chart */}
          <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none bg-gradient-to-b from-[#0f172a] to-transparent">
            <h3 className="text-[#06b6d4] font-bold text-lg drop-shadow-md">
              Mapa Chile — Producción
            </h3>
          </div>

          <MapContainer
            center={center}
            zoom={4}
            style={{ height: "100%", width: "100%", background: "#0f172a" }}
            zoomControl={false} // We will add it manually to position if needed, or use default
          >
            {/* Custom Dark Tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <ZoomControl position="topleft" />

            {plants.map((plant) => {
              // Calculate radius based on production volume (simple scaling)
              // Base size 10, max size approx 35 for 500k
              const radius = 10 + plant.production_volume / 20000;

              return (
                <CircleMarker
                  key={plant.id}
                  center={[plant.latitude, plant.longitude]}
                  radius={radius}
                  pathOptions={{
                    color: "#06b6d4",
                    fillColor: "#06b6d4",
                    fillOpacity: 0.6,
                    weight: 2,
                  }}
                >
                  <Popup className="custom-popup-dark">
                    <div className="text-slate-900">
                      <strong className="block text-sm mb-1">
                        {plant.plant_name}
                      </strong>
                      <span className="text-xs">
                        Vol:{" "}
                        {parseInt(plant.production_volume).toLocaleString()} kg
                      </span>
                      <br />
                      <span className="text-xs capitalize text-slate-500">
                        {plant.region}
                      </span>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProductionMap;
