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
    createdAt?: Date;
    updatedAt?: Date;
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

    async createClient(client: Client): Promise<Client> {
        return await firstValueFrom(this.http.post<Client>(this.apiUrl, client));
    }

    async updateClient(id: number, client: Client): Promise<Client> {
        return await firstValueFrom(this.http.put<Client>(`${this.apiUrl}/${id}`, client));
    }

    async deleteClient(id: number): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    }
}
