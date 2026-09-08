import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoucherService {
  private apiUrl = `${environment.apiUrl}vouchers`;

  constructor(private http: HttpClient) {}

  generateVoucher(serviceIds: number[]) {
    return firstValueFrom(this.http.post(`${this.apiUrl}/generate`, { serviceIds }, { responseType: 'blob' }));
  }
}
