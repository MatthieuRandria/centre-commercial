import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './pages/home/home.component';
import { AdminComponent } from './pages/admin/admin.component';
import { BoutiqueComponent } from './pages/boutique/boutique.component';
import { ClientComponent } from './pages/client/client.component';
import { RoleGuard } from './guards/role-guard.guard';

export const routes: Routes = [
    // { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },

    { path: 'admin', component: AdminComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'admin' } },  
    { path: 'boutique', component: BoutiqueComponent,canActivate: [AuthGuard, RoleGuard], data: { role: 'boutique' } },
    { path: 'client', component: ClientComponent,canActivate: [AuthGuard, RoleGuard], data: { role: 'client' } },
    {path: 'dashboard',    component: DashboardComponent,canActivate: [AuthGuard]}
];
