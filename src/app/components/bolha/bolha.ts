import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bolha',
  templateUrl: './bolha.html',
  styleUrl: './bolha.scss',
  standalone: true,
  imports: [CommonModule]
})
export class BolhaComponent {
  constructor(private router: Router) {}

  navigateToChatbot(): void {
    this.router.navigate(['/main/chatbot']);
  }
}
