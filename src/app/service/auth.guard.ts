import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }
    // Redirect non-operational roles to their own portal
    if (this.authService.isDriver())  { this.router.navigate(['/driver']); return false; }
    if (this.authService.isClient())  { this.router.navigate(['/client']); return false; }
    return true;
  }
}
