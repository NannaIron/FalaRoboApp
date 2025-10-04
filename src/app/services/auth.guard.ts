import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.checkAuth();
  }

  private checkAuth(): boolean {
    const token = this.loginService.getAuthToken();
    const isLoggedIn = this.loginService.isLoggedIn();

    if (token && isLoggedIn && this.isValidToken(token)) {
      return true;
    } else {
      this.loginService.logout();
      this.router.navigate(['/login']);
      return false;
    }
  }

  private isValidToken(token: string): boolean {
    const expectedToken = 'dfhdhgjjkjhk867thuku76565e54sjkiuo76ytftr543';
    return token === expectedToken;
  }
}
