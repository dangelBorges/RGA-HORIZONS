export const ADMIN_SECTION_MAP = {
    maintenance_calibration: {
        table: 'maintenance_calibration',
    },

    vehicle_inspection: {
        table: 'vehicle_inspection',
    },

    general_cleaning: {
        table: 'general_cleaning',
    },

    environmental_controls: {
        table: 'environmental_controls',
    },

    supplier_evaluation: {
        table: 'supplier_evaluations', // 👈 PLURAL (real)
    },

    import_records: {
        table: 'import_records',
        dateColumn: 'fecha', // fecha real del evento
    },

    vehicle_maintenance: {
        table: 'vehicle_maintenance',
    },

    pest_control: {
        table: 'pest_control',
    },

    action_plans: {
        table: 'action_plans',
    },

    internal_audits: {
        table: 'internal_audits',
    },

    training_sessions: {
        table: null, // 🚫 NO EXISTE → no se consulta
    },

    raw_material_analysis: {
        table: 'raw_material_analysis',
    },
};
