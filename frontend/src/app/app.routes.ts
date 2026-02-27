import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './pages/home/home.component';
import { AdminComponent } from './pages/admin/admin.component';
import { BoutiquesComponent } from './pages/boutique/boutique.component';
import { BoutiqueDetailComponent } from './pages/boutique-details/boutique-details.component';
import { ClientComponent } from './pages/client/client.component';
import { RoleGuard } from './guards/role-guard.guard';
import { ProduitsListComponent } from './produit/produits-list/produits-list.component';
import { BoutiqueListComponent } from './pages/boutique-list/boutique-list.component';
import { MeComponent } from './pages/me/me.component';
import { ContactComponent } from './pages/contact/contact.component';

export const routes: Routes = [
    // { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },

    { path: 'admin', component: AdminComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'admin' } },
    { path: 'produits', component: ProduitsListComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'boutiques', component: BoutiqueListComponent, canActivate: [AuthGuard], data: { role: "admin" } },
    { path: 'boutique', component: BoutiquesComponent, canActivate: [AuthGuard] },
    { path: 'boutique/:slug', component: BoutiqueDetailComponent, canActivate: [AuthGuard] },
    { path: 'client', component: ClientComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'client' } },
    { path: 'profil', component: MeComponent, canActivate: [AuthGuard] },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] }
];
