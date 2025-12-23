export const ADMIN_SECTION_COLUMNS = {
    maintenance_calibration: [
        { key: 'activity', label: 'Actividad' },
        { key: 'frequency', label: 'Frecuencia' },
        { key: 'status_text', label: 'Estado', type: 'status' },
        { key: 'notes', label: 'Observaciones' },
    ],

    vehicle_inspection: [
        { key: 'control', label: 'Control' },
        { key: 'frequency', label: 'Frecuencia' },
        { key: 'status_text', label: 'Estado', type: 'status' },
        { key: 'notes', label: 'Observaciones' },
    ],

    general_cleaning: [
        { key: 'area', label: 'Área' },
        { key: 'frequency', label: 'Frecuencia' },
        { key: 'status_text', label: 'Estado', type: 'status' },
        { key: 'notes', label: 'Observaciones' },
    ],

    environmental_controls: [
        { key: 'control', label: 'Control' },
        { key: 'frequency', label: 'Frecuencia' },
        { key: 'result_text', label: 'Resultado', type: 'status' },
        { key: 'notes', label: 'Observaciones' },
    ],

    supplier_evaluation: [
        { key: 'supplier', label: 'Proveedor' },
        { key: 'claims', label: 'Reclamos' },
        { key: 'response_time', label: 'Tiempo de respuesta' },
        { key: 'notes', label: 'Observaciones' },
    ],

    import_records: [
        { key: 'date', label: 'Fecha' },
        { key: 'purchase_order', label: 'Orden de compra' },
        { key: 'origin', label: 'Origen' },
        { key: 'status_text', label: 'Estado recepción', type: 'status' },
    ],

    vehicle_maintenance: [
        { key: 'vehicle', label: 'Vehículo' },
        { key: 'last_maintenance', label: 'Última mantención' },
        { key: 'next_maintenance', label: 'Próxima mantención' },
        { key: 'notes', label: 'Observaciones' },
    ],

    pest_control: [
        { key: 'date', label: 'Fecha' },
        { key: 'description', label: 'Descripción del trabajo' },
        { key: 'notes', label: 'Observaciones' },
    ],

    action_plans: [
        { key: 'action', label: 'Acción' },
        { key: 'status_text', label: 'Estado', type: 'status' },
        { key: 'responsible', label: 'Responsable' },
        { key: 'closing_date', label: 'Fecha cierre' },
    ],

    internal_audits: [
        { key: 'date', label: 'Fecha' },
        { key: 'client', label: 'Cliente' },
        { key: 'gd', label: 'GD' },
        { key: 'product', label: 'Producto' },
        { key: 'batch', label: 'Lote' },
        { key: 'result_text', label: 'Resultado', type: 'status' },
    ],

    training_sessions: [
        { key: 'date', label: 'Fecha' },
        { key: 'topic', label: 'Tema' },
        { key: 'participants', label: 'Participantes' },
        { key: 'mode', label: 'Modalidad' },
        { key: 'trainer', label: 'Impartió' },
    ],

    raw_material_analysis: [
        { key: 'purchase_order', label: 'OC' },
        { key: 'origin', label: 'Origen' },
        { key: 'status_text', label: 'Estado', type: 'status' },
        { key: 'notes', label: 'Observaciones' },
    ],
};
