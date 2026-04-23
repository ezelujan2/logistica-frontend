import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SystemConfiguration {
    id?: number;
    name?: string;
    isFavorite?: boolean;
    kmPrice: number;
    hourPrice: number;
    extraKmPrice: number;
    driverKmPrice: number;
    driverHourPrice: number;
}

@Injectable({
    providedIn: 'root'
})
export class ConfigurationService {
    private apiUrl = environment.apiUrl + 'configuration';

    constructor(private http: HttpClient) {}

    getConfigs(): Observable<SystemConfiguration[]> {
        return this.http.get<SystemConfiguration[]>(this.apiUrl);
    }

    createConfig(config: SystemConfiguration): Observable<SystemConfiguration> {
        return this.http.post<SystemConfiguration>(this.apiUrl, config);
    }

    updateConfig(id: number, config: Partial<SystemConfiguration>): Observable<SystemConfiguration> {
        return this.http.put<SystemConfiguration>(`${this.apiUrl}/${id}`, config);
    }

    deleteConfig(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    increaseRates(percentages: { clientKmInc: number, clientExtraKmInc: number, clientHourInc: number, driverKmInc: number, driverHourInc: number }): Observable<SystemConfiguration[]> {
        return this.http.post<SystemConfiguration[]>(`${this.apiUrl}/increase`, percentages);
    }
}
