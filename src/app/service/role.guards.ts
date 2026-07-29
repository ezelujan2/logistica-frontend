import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class DriverGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(): boolean {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return false; }
    if (this.auth.isDriver()) return true;
    this.redirectByRole();
    return false;
  }
  private redirectByRole() {
    if (this.auth.isClient())     this.router.navigate(['/client']);
    else                          this.router.navigate(['/app']);
  }
}

@Injectable({ providedIn: 'root' })
export class ClientGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(): boolean {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return false; }
    if (this.auth.isClient()) return true;
    this.redirectByRole();
    return false;
  }
  private redirectByRole() {
    if (this.auth.isDriver())     this.router.navigate(['/driver']);
    else                          this.router.navigate(['/app']);
  }
}

@Injectable({ providedIn: 'root' })
export class OperationalGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(): boolean {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return false; }
    if (this.auth.isOperational()) return true;
    if (this.auth.isDriver())  this.router.navigate(['/driver']);
    else if (this.auth.isClient()) this.router.navigate(['/client']);
    else this.router.navigate(['/login']);
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(): boolean {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return false; }
    if (this.auth.isAdmin()) return true;
    this.router.navigate(['/app']);
    return false;
  }
}
