import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role-guard.guard';

import { ManagerProduitFormComponent } from './pages/manager-boutique/produit/form/form.component';
import { ManagerProduitsListComponent } from './pages/manager-boutique/produit/list/list.component';
import { ManagerCommandesListComponent } from './pages/manager-boutique/commandes/list/list.component';
import { ManagerCommandeDetailComponent } from './pages/manager-boutique/commandes/details/details.component';

export const routes: Routes = [
<<<<<<< Updated upstream
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },
=======
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'contact', component: ContactComponent },

    // ── Manager boutique ── (routes statiques AVANT :slug)
    { path: 'boutique/produits', component: ManagerProduitsListComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'boutique' } },
    { path: 'boutique/produits/ajouter', component: ManagerProduitFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'boutique' } },
    { path: 'boutique/produits/:id/modifier', component: ManagerProduitFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'boutique' } },
    { path: 'boutique/commandes', component: ManagerCommandesListComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'boutique' } },
    { path: 'boutique/commandes/:id', component: ManagerCommandeDetailComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'boutique' } },

    // ── Boutique publique ── (route dynamique EN DERNIER)
    { path: 'boutique', component: BoutiquesComponent },
    { path: 'boutique/:slug', component: BoutiqueDetailComponent },
>>>>>>> Stashed changes

  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup.component').then(m => m.SignupComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact.component').then(m => m.ContactComponent),
  },
  {
    path: 'promotions',
    loadComponent: () =>
      import('./pages/promotion-public/promotion-public.component').then(m => m.PromotionPublicComponent),
  },

<<<<<<< Updated upstream

  // Boutique (Public)
  {
    path: 'boutique',
    loadComponent: () =>
      import('./pages/boutique/boutique.component').then(m => m.BoutiquesComponent),
  },
  {
    path: 'boutique/:slug',
    loadComponent: () =>
      import('./pages/boutique-details/boutique-details.component').then(m => m.BoutiqueDetailComponent),
  },

  // Produits
  {
    path: 'produits',
    loadComponent: () =>
      import('./pages/catalogue/catalogue.component').then(m => m.CatalogueComponent),
  },
  {
    path: 'produits/:id',
    loadComponent: () =>
      import('./pages/produit-detail/produit-detail.component').then(m => m.ProduitDetailComponent),
  },

  // Admin (Grouped + Protected)
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin/admin.component').then(m => m.AdminComponent),
      },
      {
        path: 'boutiques',
        loadComponent: () =>
          import('./pages/admin-boutique/admin-boutique.component').then(m => m.AdminBoutiqueComponent),
      },
      {
        path: 'boutiques/add',
        loadComponent: () =>
          import('./pages/boutique-form/boutique-form.component').then(m => m.BoutiqueFormComponent),
      },
      {
        path: 'boutiques/:id/edit',
        loadComponent: () =>
          import('./pages/boutique-form/boutique-form.component').then(m => m.BoutiqueFormComponent),
      },
      {
        path: 'promotions',
        loadComponent:()=>
          import('./pages/manager-promotion/manager-promotion.component').then(m => m.ManagerPromotionComponent),
      },
    ],
  },

  // Client (Grouped + Protected)
  {
    path: 'client',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'client' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/client/client.component').then(m => m.ClientComponent),
      },
      {
        path: 'commandes',
        loadComponent: () =>
          import('./pages/client-commande/client-commande.component').then(m => m.ClientCommandeComponent),
      },
      {
        path: 'commandes/:id',
        loadComponent: () =>
          import('./pages/commande-detail/commande-detail.component').then(m => m.CommandeDetailComponent),
      },
      {
        path: 'commandes/confirm/:id',
        loadComponent: () =>
          import('./pages/confirmation-commande/confirmation-commande.component').then(m => m.CommandeConfirmationComponent),
      },
      {
        path: 'favoris',
        loadComponent: () =>
          import('./pages/favoris/favoris.component').then(m => m.FavorisComponent),
      },
    ],
  },

  {
    path: 'profil',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/me/me.component').then(m => m.MeComponent),
  },
  {
    path: 'panier',
    loadComponent: () =>
        import('./pages/panier/panier.component').then(m => m.PanierComponent),
    },

  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },

  // 404 fallback
  {
    path: '**',
    redirectTo: '',
  },
];
=======
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
>>>>>>> Stashed changes
