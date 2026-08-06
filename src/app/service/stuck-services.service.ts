import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StuckService {
    id: number;
    status: string;
    origin: string | null;
    destination: string | null;
    clientName: string | null;
    daysStuck: number;
    thresholdDays: number;
    phase: 'facturacion' | 'cobro';
}

@Injectable({ providedIn: 'root' })
export class StuckServicesService {
    private apiUrl = environment.apiUrl + 'stuck-services';

    constructor(private http: HttpClient) {}

    async getStuckServices(): Promise<StuckService[]> {
        return await firstValueFrom(this.http.get<StuckService[]>(this.apiUrl));
    }
}
