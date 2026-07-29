import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + 'auth';

  private showReAuthSource = new Subject<{ resolve: (val: any) => void, reject: (err: any) => void }>();
  showReAuth$ = this.showReAuthSource.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private decodeToken(): any {
    const token = this.getToken();
    if (!token) return null;
    try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
  }

  getUserEmail(): string | null { return this.decodeToken()?.email ?? null; }
  getUserName(): string | null  { return this.decodeToken()?.name ?? null; }
  getRole(): string | null      { return this.decodeToken()?.role ?? null; }
  getDriverId(): number | null  { return this.decodeToken()?.driverId ?? null; }
  getClientId(): number | null  { return this.decodeToken()?.clientId ?? null; }

  isAdmin(): boolean     { const r = this.getRole(); return r === 'ADMIN'; }
  isDirector(): boolean  { const r = this.getRole(); return r === 'ADMIN' || r === 'DIRECTOR' || r === 'USER'; }
  isDriver(): boolean    { return this.getRole() === 'DRIVER'; }
  isClient(): boolean    { return this.getRole() === 'CLIENT'; }
  isOperational(): boolean { const r = this.getRole(); return ['USER','ADMIN','DIRECTOR'].includes(r ?? ''); }

  promptReAuth(): Observable<any> {
    return new Observable(observer => {
      this.showReAuthSource.next({
        resolve: (val) => { observer.next(val); observer.complete(); },
        reject: (err) => { observer.error(err); }
      });
    });
  }
}
