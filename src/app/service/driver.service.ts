import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Driver {
    id?: number;
    name: string;
    phone?: string;
    email?: string;
    cuit?: string;
    license_number?: string;
    dni?: string | null;
    address?: string | null;
    birth_date?: string | Date | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    /** Datos para pagarle las liquidaciones. */
    cbu?: string | null;
    cbu_alias?: string | null;
    bank?: string | null;
    account_holder?: string | null;
    /** Calendario de Google propio del chofer, donde se copian sus servicios. */
    google_calendar_id?: string | null;
    carnetVencimiento?: string | Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DriverSummary {
    year: number;
    trips: number;
    km: number;
    earnings: number;
    monthly: { month: number; trips: number; earnings: number }[];
    topClients: { id: number; name: string; trips: number }[];
    toSettle: { count: number; amount: number };
    pendingAdvances: { count: number; amount: number };
    firstServiceDate: string | null;
    lastServiceDate: string | null;
    lastSettlement: { id: number; code: string; createdAt: string; totalAmount: number; status: string } | null;
}

@Injectable({
    providedIn: 'root'
})
export class DriverService {
    private apiUrl = environment.apiUrl + 'drivers';

    constructor(private http: HttpClient) {}

    async getDrivers(): Promise<Driver[]> {
        return await firstValueFrom(this.http.get<Driver[]>(this.apiUrl));
    }

    async getDriver(id: number): Promise<Driver> {
        return await firstValueFrom(this.http.get<Driver>(`${this.apiUrl}/${id}`));
    }

    async getSummary(id: number, year: number): Promise<DriverSummary> {
        return await firstValueFrom(this.http.get<DriverSummary>(`${this.apiUrl}/${id}/summary`, { params: { year } }));
    }

    async createDriver(driver: Driver): Promise<Driver> {
        return await firstValueFrom(this.http.post<Driver>(this.apiUrl, driver));
    }

    async updateDriver(id: number, driver: Driver): Promise<Driver> {
        return await firstValueFrom(this.http.put<Driver>(`${this.apiUrl}/${id}`, driver));
    }

    async deleteDriver(id: number): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    }
}
