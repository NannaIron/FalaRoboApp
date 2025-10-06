import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-bolha',
  templateUrl: './bolha.html',
  styleUrl: './bolha.scss',
  standalone: true,
  imports: [CommonModule]
})
export class BolhaComponent {
  constructor(private router: Router, private popup: PopupService) {}

  navigateToChatbot(): void {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      this.router.navigate(['/main/chatbot']);
    } else {
      this.popup.open();
    }
  }
}
