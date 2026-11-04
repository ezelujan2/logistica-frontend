import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

/**
 * Los datos de una factura tal como se cargan. LECMA = comprobante de la
 * empresa (tipo + punto de venta + número). OTHER = una a título personal o un
 * caso raro, con el número en texto libre como antes.
 */
export interface InvoiceForm {
    issuer: 'LECMA' | 'OTHER';
    voucherType: number;
    pointOfSale: number;
    number: number | null;
    issueDate: Date | null;
    invoiceNumber: string;
    /** Sólo en las hechas a mano en ARCA: el CAE (opcional). */
    cae: string;
    /** PDF adjunto (el que descarga ARCA), nombre del archivo subido. */
    pdfFile: string | null;
}

export function emptyInvoiceForm(): InvoiceForm {
    return { issuer: 'LECMA', voucherType: 1, pointOfSale: 1, number: null, issueDate: new Date(), invoiceNumber: '', cae: '', pdfFile: null };
}

/** El formulario a partir de una factura guardada. */
export function invoiceFormFrom(invoice: any): InvoiceForm {
    const form = emptyInvoiceForm();
    if (!invoice) return form;
    return {
        ...form,
        issuer: invoice.issuer ?? 'OTHER',
        voucherType: invoice.voucherType ?? form.voucherType,
        pointOfSale: invoice.pointOfSale ?? form.pointOfSale,
        number: invoice.number ?? null,
        issueDate: invoice.issueDate ? new Date(invoice.issueDate) : null,
        invoiceNumber: invoice.invoiceNumber ?? '',
        cae: invoice.cae ?? '',
        pdfFile: invoice.pdfFile ?? null
    };
}

export function isInvoiceFormComplete(f: InvoiceForm): boolean {
    return f.issuer === 'OTHER' ? !!f.invoiceNumber.trim() : !!f.voucherType && f.pointOfSale > 0 && !!f.number && f.number > 0;
}

export interface ArcaStatus {
    enabled: boolean;
    env?: 'homologacion' | 'produccion';
    pointOfSale?: number;
    /** Monto mínimo de FCE: desde ahí, a las empresas del registro se les factura con FCE A. */
    fceMin?: number;
    servers?: { app: string; db: string; auth: string };
    error?: string;
}

export interface NoteForm {
    kind: 'credit' | 'debit';
    /** total: anula la factura (servicios vuelven a "A facturar"). amount: por un importe. */
    mode: 'total' | 'amount';
    net: number | null;
    rate: number;
    description: string;
}

/** Si la factura se emitió desde LECMA en ARCA (tiene PDF y se corrige con notas). */
export const isArcaInvoice = (invoice: any) => !!invoice?.arcaData;

/** Tiene PDF para bajar: la armamos nosotros (ARCA) o se adjuntó el de ARCA. */
/** Igual que el backend: la OC sale como "OC 3196", la hayan escrito "3196", "OC3196" u "oc: 3196". */
export function purchaseOrderLabel(purchaseOrder: string): string {
  return `OC ${purchaseOrder.trim().replace(/^o\.?\s*c\.?[\s:#°º.-]*(?:n[°º.]?|nro\.?)?[\s:#°º.-]*(?=\d)/i, '')}`;
}

export const hasInvoicePdf = (invoice: any) => isArcaInvoice(invoice) || !!invoice?.pdfFile;

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}invoices`;

  constructor(private http: HttpClient) {}

  /** purchaseOrders: la OC de cada reporte, { idReporte: "OC3196" }. */
  createInvoice(serviceIds: number[], clientId: number, form: InvoiceForm, purchaseOrders: Record<number, string> = {}) {
    return firstValueFrom(this.http.post<any>(this.apiUrl, { serviceIds, clientId, ...form, purchaseOrders }));
  }

  getInvoices(filters: { clientId?: number } = {}) {
    return firstValueFrom(this.http.get<any[]>(this.apiUrl, { params: filters }));
  }

  updateInvoice(invoiceId: number, form: InvoiceForm, serviceIds?: number[]) {
    return firstValueFrom(this.http.put<any>(`${this.apiUrl}/${invoiceId}`, { ...form, serviceIds }));
  }

  /** Si se puede emitir en ARCA desde LECMA, en qué entorno y con qué punto de venta. */
  arcaStatus() {
    return firstValueFrom(this.http.get<ArcaStatus>(`${this.apiUrl}/arca/status`));
  }

  /** Sube el PDF de una factura hecha a mano; devuelve el nombre del archivo. */
  async uploadPdf(file: File): Promise<string> {
    const body = new FormData();
    body.append('file', file);
    const r = await firstValueFrom(this.http.post<{ url: string }>(`${environment.apiUrl}upload`, body));
    return r.url.split('/').pop()!;
  }

  /** Razón social, domicilio y condición frente al IVA de un CUIT, según ARCA. */
  padron(cuit: string) {
    return firstValueFrom(
      this.http.get<{ legalName: string | null; address: string | null; ivaCondition: string | null; warning: string | null }>(`${this.apiUrl}/arca/padron/${cuit.replace(/\D/g, '')}`)
    );
  }

  emitArca(serviceIds: number[], clientId: number, form: InvoiceForm, purchaseOrders: Record<number, string>, extraText: string, activity: string, paymentDue: Date | null) {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/arca`, { serviceIds, clientId, voucherType: form.voucherType, issueDate: form.issueDate, purchaseOrders, extraText, activity: Number(activity), paymentDue })
    );
  }

  emitNote(invoiceId: number, note: NoteForm) {
    return firstValueFrom(this.http.post<any>(`${this.apiUrl}/${invoiceId}/note`, note));
  }

  /** Baja el PDF de una factura emitida desde LECMA. */
  /** Cobro de la factura entera: sus servicios en Pendiente Pago pasan a Pagado. */
  pay(invoiceId: number) {
    return firstValueFrom(this.http.post<{ paidServices: number }>(`${this.apiUrl}/${invoiceId}/pay`, {}));
  }

  async downloadPdf(invoiceId: number, invoiceNumber: string) {
    const blob = await firstValueFrom(this.http.get(`${this.apiUrl}/${invoiceId}/pdf`, { responseType: 'blob' }));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber.replace(/\s+/g, '_')}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** Tipo, punto de venta y número que siguen, y si al cliente se le pone la referencia en la factura. */
  suggest(clientId: number | null, voucherType?: number, pointOfSale?: number) {
    const params: any = {};
    if (clientId) params.clientId = clientId;
    if (voucherType) params.voucherType = voucherType;
    if (pointOfSale) params.pointOfSale = pointOfSale;
    return firstValueFrom(this.http.get<{ voucherType: number; pointOfSale: number; number: number }>(`${this.apiUrl}/suggest`, { params }));
  }
}
