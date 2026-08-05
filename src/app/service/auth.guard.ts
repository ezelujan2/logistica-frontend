import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Permission } from './permissions';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const permission = route.data?.['permission'] as Permission | undefined;

    // El perfil (con el rol actual) puede no estar cargado todavía, ej. tras un F5.
    const ensureProfile$ = this.authService.currentUser()
      ? of(this.authService.currentUser())
      : this.authService.loadCurrentUser().pipe(catchError(() => of(null)));

    return ensureProfile$.pipe(
      map((user) => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }
        if (permission && !this.authService.hasPermission(permission)) {
          this.router.navigate(['/app']);
          return false;
        }
        return true;
      })
    );
  }
}
