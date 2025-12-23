export const getStatusStyle = (value = '') => {
    const v = value.toLowerCase();

    const success = [
        'conforme',
        'cumple',
        'realizado',
        'ok',
        'aprobado',
        'terminado'
    ];

    const warning = [
        'pendiente',
        'en proceso'
    ];

    const danger = [
        'no conforme',
        'no aprobado',
        'malo',
        'roto',
        'descontinuado',
        'rechazado'
    ];

    if (success.some(s => v.includes(s))) {
        return 'font-bold text-emerald-600';
    }

    if (warning.some(s => v.includes(s))) {
        return 'font-bold text-amber-600';
    }

    if (danger.some(s => v.includes(s))) {
        return 'font-bold text-red-600';
    }

    return 'text-foreground';
};
