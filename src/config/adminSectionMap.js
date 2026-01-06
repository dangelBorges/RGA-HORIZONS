// src/config/adminSectionMap.js
export const ADMIN_SECTION_MAP = {
  maintenance_calibration: {
    table: "maintenance_calibration",
    mode: "carry_forward",
  },

  vehicle_inspection: {
    table: "vehicle_inspection",
    mode: "events",
  },

  general_cleaning: {
    table: "general_cleaning",
    mode: "events",
  },

  environmental_controls: {
    table: "environmental_controls",
    mode: "carry_forward",
  },

  supplier_evaluation: {
    table: "supplier_evaluations",
    mode: "carry_forward",
  },

  import_records: {
    table: "import_records",
    dateColumn: "fecha", // evento real
    mode: "events",
  },

  vehicle_maintenance: {
    table: "vehicle_maintenance",
    mode: "carry_forward",
  },

  pest_control: {
    table: "pest_control",
    mode: "carry_forward",
  },

  action_plans: {
    table: "action_plans",
    mode: "events",
  },

  internal_audits: {
    table: "internal_audits",
    mode: "carry_forward",
  },

  training_sessions: {
    table: null, // no existe
  },

  raw_material_analysis: {
    table: "raw_material_analysis",
    mode: "events",
  },
};
