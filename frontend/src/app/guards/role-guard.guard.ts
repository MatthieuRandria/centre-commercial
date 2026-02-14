import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    const expectedRole: number = route.data['role'];
    const userRole = (this.authService.getCurrentUser()).role;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    if (userRole === expectedRole) {
      return true; // rôle correct → accès autorisé
    } else {
      this.router.navigate(['/unauthorized']); // rôle incorrect → page interdite
      return false;
    }
  }
}
