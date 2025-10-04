import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginService, User } from '../../../services/login.service';
import { MenuComponent } from '../menu/menu';

@Component({
  selector: 'app-main',
  templateUrl: './main.html',
  styleUrl: './main.scss',
  standalone: true,
  imports: [CommonModule, MenuComponent]
})
export class MainComponent implements OnInit {
  currentUser: User | null = null;
  authToken: string | null = null;
  isMenuOpen = false;

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.loginService.getCurrentUser();
    this.authToken = this.loginService.getAuthToken();
  }

  logout(): void {    
    this.loginService.logout();
    this.router.navigate(['/login']);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
