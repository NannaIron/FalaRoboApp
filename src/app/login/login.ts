import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoginService, LoginRequest } from '../services/login.service';

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
  successMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(3)]], // Changed to 3 for mock "123"
      rememberMe: [false]
    });

    // Check if user is already logged in
    if (this.loginService.isLoggedIn()) {
      const user = this.loginService.getCurrentUser();
      this.successMessage = `Bem-vindo de volta, ${user?.username}!`;
    }
  }

  // Getters for easy access to form controls
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
      // Clear previous messages
      this.errorMessage = '';
      this.successMessage = '';
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
            this.successMessage = response.message || 'Login realizado com sucesso!';
            console.log('Login successful:', response);
            
            // Here you would typically navigate to dashboard or main app
            // For now, we'll just show the success message
            setTimeout(() => {
              this.successMessage = `Bem-vindo, ${response.user?.username}! Login realizado com sucesso.`;
            }, 100);
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
      // Mark all fields as touched to show validation errors
      this.loginForm.markAllAsTouched();
    }
  }

  // Method to logout (for testing purposes)
  logout(): void {
    this.loginService.logout();
    this.successMessage = '';
    this.errorMessage = '';
    this.loginForm.reset();
    console.log('User logged out');
  }
}
