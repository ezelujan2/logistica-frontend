import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SystemConfiguration {
    id: number;
    kmPrice: number;
    hourPrice: number;
    driverKmPrice: number;
    driverHourPrice: number;
}

@Injectable({
    providedIn: 'root'
})
export class ConfigurationService {
    private apiUrl = environment.apiUrl + 'configuration';

    constructor(private http: HttpClient) {}

    getConfig(): Observable<SystemConfiguration> {
        return this.http.get<SystemConfiguration>(this.apiUrl);
    }

    updateConfig(config: Partial<SystemConfiguration>): Observable<SystemConfiguration> {
        return this.http.put<SystemConfiguration>(this.apiUrl, config);
    }
}
