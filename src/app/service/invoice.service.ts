import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}invoices`;

  constructor(private http: HttpClient) {}

  createInvoice(serviceIds: number[], clientId: number, invoiceNumber?: string) {
    return firstValueFrom(this.http.post<any>(this.apiUrl, { serviceIds, clientId, invoiceNumber }));
  }

  getInvoices() {
    return firstValueFrom(this.http.get<any[]>(this.apiUrl));
  }
}
