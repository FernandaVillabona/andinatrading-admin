import { Routes } from '@angular/router';
import { LayoutComponent } from './pages/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LogsComponent } from './pages/logs/logs.component';
import { UsersComponent } from './pages/users/usuarios.component';
import { BackupsComponent } from './pages/backups/backups.component';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { HistorialComponent } from './pages/historial/historial.component';
import { AnalisisComponent } from './pages/analisis/analisis.component';

export const routes: Routes = [
  // 🔹 Página de inicio de sesión (fuera del layout)
  { path: '', component: HomeComponent },

  // 🔹 Panel administrativo protegido
  {
    path: 'admin',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'logs', component: LogsComponent },
      { path: 'usuarios', component: UsersComponent },
      { path: 'backups', component: BackupsComponent },
      { path: 'historial', component: HistorialComponent },
      { path: 'analisis', component: AnalisisComponent } ,

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // 🔹 Página 404 (debe ir al final)
  { path: '**', component: NotFoundComponent }
];
