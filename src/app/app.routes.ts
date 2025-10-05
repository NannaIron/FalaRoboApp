import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { MainComponent } from './components/main/main';
import { ChatbotComponent } from './components/chatbot/chatbot';
import { CanvasComponent } from './components/canvas/canvas';
import { AuthGuard } from '../services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'main', 
    component: MainComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'chatbot', component: ChatbotComponent },
      { path: 'piston-small', component: CanvasComponent, data: { selectedOption: 'pistao-pequeno' } },
      { path: 'piston-big', component: CanvasComponent, data: { selectedOption: 'pistao-grande' } },
      { path: 'complete', component: CanvasComponent, data: { selectedOption: 'completo' } },
      { path: '', redirectTo: 'chatbot', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: '/main/chatbot', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
