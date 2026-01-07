import React from "react";
import ProductionFilters from "@/components/ProductionFilters";

export default function FiltersAside({ filters, onFilterChange, availableYears }) {
  return (
    <ProductionFilters
      filters={filters}
      onFilterChange={onFilterChange}
      availableYears={availableYears}
    />
  );
}
