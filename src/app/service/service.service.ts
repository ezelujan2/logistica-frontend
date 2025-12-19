import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Service {
    id?: string;
    name: string;
    description: string;
    status: string;
    price: number;
}

@Injectable({
    providedIn: 'root'
})
export class ServiceService {
    private apiUrl = 'http://localhost:3000/services';

    constructor(private http: HttpClient) {}

    getServices(): Observable<Service[]> {
        return this.http.get<Service[]>(this.apiUrl);
    }

    createService(service: Service): Observable<Service> {
        return this.http.post<Service>(this.apiUrl, service);
    }
}
