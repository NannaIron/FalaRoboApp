import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { LoginService, User } from '../../../services/login.service';
import { MenuComponent } from '../menu/menu';
import { BolhaComponent } from '../bolha/bolha';
import { ControlComponent } from '../control/control';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { SensorService } from '../../../services/sensor.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.html',
  styleUrl: './main.scss',
  standalone: true,
  imports: [CommonModule, MenuComponent, RouterOutlet, BolhaComponent, ControlComponent]
})
export class MainComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  authToken: string | null = null;
  isMenuOpen = false;
  showBolha = true;
  showControl = true;

  private router = inject(Router);
  private loginService = inject(LoginService);
  private sensorService = inject(SensorService);
  private sub!: Subscription;

  ngOnInit(): void {
    this.sensorService.postSensors().subscribe({
      next: () => console.log('Sensores fixos enviados na inicialização'),
      error: (err) => console.error('Erro ao enviar sensores fixos:', err)
    });
    
    this.currentUser = this.loginService.getCurrentUser();
    this.authToken = this.loginService.getAuthToken();

    this.updateVisibility(this.router.url);

    this.sub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateVisibility(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  private updateVisibility(url: string): void {
    const normalized = url.split('?')[0].split('#')[0];
    const isChatbot = normalized === '/main/chatbot' || normalized === '/main/chatbot/';
    this.showBolha = !isChatbot;
    this.showControl = !isChatbot;
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

  onMenuSelect(selectedId: string): void {
    this.closeMenu();

    let route = '';
    switch (selectedId) {
      case 'chatbot':
        route = '/main/chatbot';
        break;
      case 'completo':
        route = '/main/complete';
        break;
      case 'pistao-grande':
        route = '/main/piston-big';
        break;
      case 'pistao-pequeno':
        route = '/main/piston-small';
        break;
      default:
        route = '/main/chatbot';
    }

    this.router.navigate([route]);
  }
}
