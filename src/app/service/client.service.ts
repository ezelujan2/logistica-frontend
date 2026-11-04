import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Client {
    id?: number;
    name: string;
    /** Razón social: la que sale en la factura. Vacía = el nombre. */
    legal_name?: string | null;
    cuit?: string;
    /** Inscripto o Monotributo → Factura A; Exento o Consumidor Final → Factura B, con el IVA incluido sin discriminar. */
    iva_condition?: 'RESPONSABLE_INSCRIPTO' | 'MONOTRIBUTO' | 'EXENTO' | 'CONSUMIDOR_FINAL' | null;
    /** Manda orden de compra (ej. Sidersa): la OC es obligatoria en cada reporte para facturar. */
    requires_purchase_order?: boolean;
    /** Empresa del registro de FCE: desde el monto mínimo se le factura con FCE A. */
    receives_fce?: boolean;
    address?: string;
    phone?: string;
    email?: string;
    send_details?: boolean;
    send_invoices?: boolean;
    payment_terms?: string;
    billing_cycle_days?: number | null;
    payment_terms_days?: number | null;
    notes?: string;
    default_km_price?: number;
    default_waiting_hour_price?: number;
    default_extra_km_price?: number;
    contacts?: ClientContact[];
    createdAt?: Date;
    updatedAt?: Date;
}

/** Una persona de la empresa cliente (ej. Lepa → Ignacio, de compras). */
export interface ClientContact {
    id?: number;
    name: string;
    role?: string | null;
    phone?: string | null;
    email?: string | null;
    /** Texto libre, ej. "Recibe las facturas". */
    comments?: string | null;
}

/** Link de WhatsApp para un teléfono argentino: 0341 15-555-1234 → 5493415551234. */
export function whatsappLink(phone: string | null | undefined): string | null {
    let digits = (phone ?? '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('54')) digits = digits.slice(2);
    if (digits.startsWith('9')) digits = digits.slice(1);
    if (digits.startsWith('0')) digits = digits.slice(1);
    // El 15 de los celulares va después del código de área (2 a 4 dígitos); con el 9 delante ya no hace falta.
    const fifteen = digits.length === 12 ? digits.match(/^(\d{2,4}?)15(\d{6,8})$/) : null;
    if (fifteen && fifteen[1].length + fifteen[2].length === 10) digits = fifteen[1] + fifteen[2];
    return digits.length === 10 ? `https://wa.me/549${digits}` : null;
}

@Injectable({
    providedIn: 'root'
})
export class ClientService {
    private apiUrl = environment.apiUrl + 'clients';

    constructor(private http: HttpClient) {}

    async getClients(): Promise<Client[]> {
        return await firstValueFrom(this.http.get<Client[]>(this.apiUrl));
    }

    async getClient(id: number): Promise<Client> {
        return await firstValueFrom(this.http.get<Client>(`${this.apiUrl}/${id}`));
    }

    async createClient(client: Client): Promise<Client> {
        return await firstValueFrom(this.http.post<Client>(this.apiUrl, client));
    }

    async updateClient(id: number, client: Client): Promise<Client> {
        return await firstValueFrom(this.http.put<Client>(`${this.apiUrl}/${id}`, client));
    }

    async deleteClient(id: number): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    }

    async saveContact(clientId: number, contact: ClientContact): Promise<ClientContact> {
        return contact.id
            ? await firstValueFrom(this.http.put<ClientContact>(`${this.apiUrl}/${clientId}/contacts/${contact.id}`, contact))
            : await firstValueFrom(this.http.post<ClientContact>(`${this.apiUrl}/${clientId}/contacts`, contact));
    }

    async deleteContact(clientId: number, contactId: number): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/${clientId}/contacts/${contactId}`));
    }
}
