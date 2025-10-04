import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginService, LoginRequest } from '../../../services/login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      rememberMe: [false]
    });

    if (this.loginService.isLoggedIn()) {
      this.router.navigate(['/main']);
    }
  }

  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  get rememberMe() {
    return this.loginForm.get('rememberMe')!;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage = '';
      this.isLoading = true;

      const loginRequest: LoginRequest = {
        email: this.email.value,
        password: this.password.value,
        rememberMe: this.rememberMe.value
      };
      
      console.log('Login attempt:', loginRequest);
      
      this.loginService.login(loginRequest).subscribe({
        next: (response) => {
          this.isLoading = false;
          
          if (response.success) {
            console.log('Login successful:', response);
            console.log('Token received:', response.token);
            
            this.router.navigate(['/main']);
          } else {
            this.errorMessage = response.message || 'Erro no login!';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Erro interno do sistema. Tente novamente.';
          console.error('Login error:', error);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  logout(): void {
    this.loginService.logout();
    this.errorMessage = '';
    this.loginForm.reset();
    console.log('User logged out');
  }
}
