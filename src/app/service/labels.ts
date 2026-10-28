// Nombres en castellano de los valores que se guardan en la base (estados,
// tipos). Toda pantalla usa estos, nunca el valor crudo: si se agrega un valor
// nuevo en la base, va acá y aparece en todos lados.

export const SERVICE_STATUS_LABELS: Record<string, string> = {
    CREATED: 'Creado',
    PENDING: 'Pendiente',
    PENDING_DETAILS: 'Pendiente Detalles',
    PENDING_INVOICE: 'A Facturar',
    PAYMENT_PENDING: 'Pendiente Pago',
    PAID: 'Pagado',
    CANCELLED: 'Cancelado'
};

/** Los reportes pasan además por "Generado" y "Facturado". */
export const GROUP_STATUS_LABELS: Record<string, string> = {
    ...SERVICE_STATUS_LABELS,
    GENERATED: 'Generado',
    INVOICED: 'Facturado'
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
    SERVICE: 'Servicio',
    MESSAGING: 'Mensajería',
    DRIVING: 'Conducción',
    HALF_ROUND: 'Media Vuelta',
    FREIGHT: 'Flete',
    OTHER: 'Otro'
};

export const BILLING_TYPE_LABELS: Record<string, string> = {
    OFFICIAL_A: 'Factura A/B',
    MONOTRIBUTO: 'Monotributo',
    INFORMAL: 'Informal'
};

export const EXPENSE_TYPE_LABELS: Record<string, string> = {
    FUEL: 'Combustible',
    TOLL: 'Peaje',
    WASH: 'Lavado',
    SNACK: 'Viático',
    MAINTENANCE: 'Taller / Mantenimiento',
    INSURANCE: 'Seguros',
    STRIX: 'Strix (Seguimiento Satelital)',
    STARLINK: 'Starlink',
    PATENTS: 'Patentes',
    HALF_ROUND: 'Media Vuelta',
    PERSONAL_ACCIDENT_INSURANCE: 'Seguro Accidentes Personales',
    GROSS_INCOME: 'Ingresos Brutos',
    ACCOUNTANTS: 'Contadores',
    AUTONOMOUS_REGIME: 'Régimen Autónomos',
    PARKING: 'Cocheras',
    TRAVEL_MOBILITY: 'Pasajes / Movilidad',
    WEB_MAINTENANCE: 'Mantenimiento Web',
    VAT: 'IVA',
    PROFITS: 'Ganancias',
    OTHER: 'Otro'
};

export const SETTLEMENT_STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Borrador',
    PROCESSED: 'Procesada',
    PAID: 'Pagada'
};

/** El nombre de un valor; si no está en la lista, el valor tal cual. */
export function labelOf(labels: Record<string, string>, value: string | null | undefined): string {
    return value ? (labels[value] ?? value) : '';
}

/** Las opciones de un desplegable, en el orden de la lista. */
export function optionsOf(labels: Record<string, string>): { label: string; value: string }[] {
    return Object.entries(labels).map(([value, label]) => ({ label, value }));
}
