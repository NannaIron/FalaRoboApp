import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { MainComponent } from './components/main/main';
import { AuthGuard } from '../services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'main', 
    component: MainComponent,
    canActivate: [AuthGuard]
  },
  { path: '', redirectTo: '/main', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
