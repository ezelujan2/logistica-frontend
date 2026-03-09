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
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email || null;
    } catch (e) {
      return null;
    }
  }

  promptReAuth(): Observable<any> {
    return new Observable(observer => {
      this.showReAuthSource.next({
        resolve: (val) => { observer.next(val); observer.complete(); },
        reject: (err) => { observer.error(err); }
      });
    });
  }
}
