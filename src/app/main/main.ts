import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginService, User } from '../services/login.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.html',
  styleUrl: './main.scss',
  standalone: true,
  imports: [CommonModule]
})
export class MainComponent implements OnInit {
  currentUser: User | null = null;
  authToken: string | null = null;

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user and token information
    this.currentUser = this.loginService.getCurrentUser();
    this.authToken = this.loginService.getAuthToken();

    console.log('Main component loaded');
    console.log('Current user:', this.currentUser);
    console.log('Auth token:', this.authToken);
  }

  logout(): void {
    console.log('Logging out user');
    
    // Clear authentication data
    this.loginService.logout();
    
    // Navigate back to login page
    this.router.navigate(['/login']);
  }
}
