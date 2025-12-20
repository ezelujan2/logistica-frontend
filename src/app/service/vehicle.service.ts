import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

export enum VehicleOwnership {
    OWN = 'OWN',
    THIRD_PARTY = 'THIRD_PARTY'
}

export interface Vehicle {
    id?: number;
    plate: string;
    model: string;
    ownership: VehicleOwnership;
    createdAt?: Date;
    updatedAt?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class VehicleService {
    private apiUrl = environment.apiUrl + 'vehicles';

    constructor(private http: HttpClient) {}

    async getVehicles(): Promise<Vehicle[]> {
        return await firstValueFrom(this.http.get<Vehicle[]>(this.apiUrl));
    }

    async createVehicle(vehicle: Vehicle): Promise<Vehicle> {
        return await firstValueFrom(this.http.post<Vehicle>(this.apiUrl, vehicle));
    }

    async updateVehicle(id: number, vehicle: Vehicle): Promise<Vehicle> {
        return await firstValueFrom(this.http.put<Vehicle>(`${this.apiUrl}/${id}`, vehicle));
    }

    async deleteVehicle(id: number): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    }
}
