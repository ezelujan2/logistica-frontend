import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { PERMISSIONS, Permission, Role } from './permissions';

export interface CurrentUser {
  id: number;
  email: string;
  name: string | null;
  role: Role;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + 'auth';

  private showReAuthSource = new Subject<{ resolve: (val: any) => void, reject: (err: any) => void }>();
  showReAuth$ = this.showReAuthSource.asObservable();

  // Perfil actual (incluye rol), resuelto en vivo contra el backend en vez de confiar en el JWT.
  currentUser = signal<CurrentUser | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }

  loadCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.apiUrl}/me`).pipe(
      tap((user) => this.currentUser.set(user))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserEmail(): string | null {
    return this.currentUser()?.email ?? null;
  }

  hasPermission(permission: Permission): boolean {
    const role = this.currentUser()?.role;
    if (!role) return false;
    return (PERMISSIONS[permission] as readonly string[]).includes(role);
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
