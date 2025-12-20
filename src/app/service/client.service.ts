import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Client {
    id?: number;
    name: string;
    cuit?: string;
    address?: string;
    phone?: string;
    email?: string;
    send_details?: boolean;
    send_invoices?: boolean;
    payment_terms?: string;
    notes?: string;
    default_km_price?: number;
    default_waiting_hour_price?: number;
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
