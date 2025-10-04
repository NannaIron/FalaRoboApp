import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
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
      const loginData = {
        email: this.email.value,
        password: this.password.value,
        rememberMe: this.rememberMe.value
      };
      
      console.log('Login attempt:', loginData);
      
      // Here you would typically call your authentication service
      // For now, we'll just show an alert with the form data
      alert(`Login attempt for: ${loginData.email}\nRemember me: ${loginData.rememberMe}`);
      
      // You can replace this with actual authentication logic:
      // this.authService.login(loginData).subscribe({
      //   next: (response) => {
      //     // Handle successful login
      //     console.log('Login successful', response);
      //   },
      //   error: (error) => {
      //     // Handle login error
      //     console.error('Login failed', error);
      //   }
      // });
    } else {
      // Mark all fields as touched to show validation errors
      this.loginForm.markAllAsTouched();
    }
  }
}
