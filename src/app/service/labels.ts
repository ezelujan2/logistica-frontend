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

export const IVA_CONDITION_LABELS: Record<string, string> = {
    RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
    MONOTRIBUTO: 'Monotributo',
    EXENTO: 'Exento',
    CONSUMIDOR_FINAL: 'Consumidor Final'
};

/** Actividades de LECMA registradas en ARCA; cada factura informa una. La primera es la de siempre. */
export const ARCA_ACTIVITY_LABELS: Record<string, string> = {
    '523090': '523090 · Gestión y logística para el transporte de mercaderías',
    '492190': '492190 · Transporte automotor de pasajeros n.c.p.',
    '492290': '492290 · Transporte automotor de cargas n.c.p.',
    '523039': '523039 · Operadores logísticos',
    '524190': '524190 · Servicios complementarios para el transporte terrestre'
};

export const DEFAULT_ARCA_ACTIVITY = '523090';

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

/** Comprobantes de LECMA, con el código de ARCA. `code` es como empieza el número ("FA 0001-00000003"). */
export const VOUCHER_TYPES: { value: number; code: string; label: string }[] = [
    { value: 1, code: 'FA', label: 'Factura A' },
    { value: 6, code: 'FB', label: 'Factura B' },
    { value: 201, code: 'FCE A', label: 'Factura de Crédito Electrónica A' },
    { value: 3, code: 'NCA', label: 'Nota de Crédito A' },
    { value: 8, code: 'NCB', label: 'Nota de Crédito B' },
    { value: 203, code: 'NC FCE A', label: 'Nota de Crédito FCE A' },
    { value: 2, code: 'NDA', label: 'Nota de Débito A' },
    { value: 7, code: 'NDB', label: 'Nota de Débito B' },
    { value: 202, code: 'ND FCE A', label: 'Nota de Débito FCE A' }
];

/** Igual que en el backend: "FA 0001-00000003". */
export function formatInvoiceNumber(voucherType: number, pointOfSale: number, number: number): string {
    const code = VOUCHER_TYPES.find((t) => t.value === voucherType)?.code ?? `T${voucherType}`;
    return `${code} ${String(pointOfSale).padStart(4, '0')}-${String(number).padStart(8, '0')}`;
}
