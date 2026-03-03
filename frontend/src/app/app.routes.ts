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
import { MeComponent } from './pages/me/me.component';
import { ContactComponent } from './pages/contact/contact.component';
import { AdminBoutiqueComponent } from './pages/admin-boutique/admin-boutique.component';
import { BoutiqueFormComponent } from './pages/boutique-form/boutique-form.component';
import { ClientCommandeComponent } from './pages/client-commande/client-commande.component';
import { CommandeDetailComponent } from './pages/commande-detail/commande-detail.component';
import { ProduitDetailComponent } from './pages/produit-detail/produit-detail.component';
import { CatalogueComponent } from './pages/catalogue/catalogue.component';

import { ManagerProduitFormComponent } from './pages/manager-boutique/produit/form/form.component';
import { ManagerProduitsListComponent } from './pages/manager-boutique/produit/list/list.component';
import { ManagerCommandesListComponent } from './pages/manager-boutique/commandes/list/list.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'contact', component: ContactComponent },

  // ── Manager boutique ── (routes statiques AVANT :slug)
  { path: 'boutique/produits', component: ManagerProduitsListComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'boutique' } },
  { path: 'boutique/produits/ajouter', component: ManagerProduitFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'boutique' } },
  { path: 'boutique/produits/:id/modifier', component: ManagerProduitFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'boutique' } },
  { path: 'boutique/commandes', component: ManagerCommandesListComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'boutique' } },

  // ── Boutique publique ── (route dynamique EN DERNIER)
  { path: 'boutique', component: BoutiquesComponent },
  { path: 'boutique/:slug', component: BoutiqueDetailComponent },

  { path: 'produits', component: CatalogueComponent },
  { path: 'produits/:id', component: ProduitDetailComponent },

  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'admin' } },
  { path: 'admin/boutiques', component: AdminBoutiqueComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'admin' } },
  { path: 'admin/boutiques/add', component: BoutiqueFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'admin' } },
  { path: 'admin/boutiques/:id/edit', component: BoutiqueFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'admin' } },

  { path: 'profil', component: MeComponent, canActivate: [AuthGuard] },
  { path: 'client', component: ClientComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'client' } },
  { path: 'client/commandes', component: ClientCommandeComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'client' } },
  { path: 'client/commandes/:id', component: CommandeDetailComponent, canActivate: [AuthGuard] },

  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] }
];
