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
    createdAt?: Date;
    updatedAt?: Date;
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
