import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role-guard.guard';

export const routes: Routes = [

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

  // ───────────── Manager Boutique ─────────────

  {
    path: 'boutique/produits',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'boutique' },
    loadComponent: () =>
      import('./pages/manager-boutique/produit/list/list.component')
        .then(m => m.ManagerProduitsListComponent),
  },

  {
    path: 'boutique/produits/ajouter',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'boutique' },
    loadComponent: () =>
      import('./pages/manager-boutique/produit/form/form.component')
        .then(m => m.ManagerProduitFormComponent),
  },

  {
    path: 'boutique/produits/:id/modifier',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'boutique' },
    loadComponent: () =>
      import('./pages/manager-boutique/produit/form/form.component')
        .then(m => m.ManagerProduitFormComponent),
  },

  {
    path: 'boutique/commandes',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'boutique' },
    loadComponent: () =>
      import('./pages/manager-boutique/commandes/list/list.component')
        .then(m => m.ManagerCommandesListComponent),
  },

  // ───────────── Boutique (Public) ─────────────

  {
    path: 'boutique',
    loadComponent: () =>
      import('./pages/boutique/boutique.component')
        .then(m => m.BoutiquesComponent),
  },

  {
    path: 'boutique/:slug',
    loadComponent: () =>
      import('./pages/boutique-details/boutique-details.component')
        .then(m => m.BoutiqueDetailComponent),
  },

  // ───────────── Produits ─────────────

  {
    path: 'produits',
    loadComponent: () =>
      import('./pages/catalogue/catalogue.component')
        .then(m => m.CatalogueComponent),
  },

  {
    path: 'produits/:id',
    loadComponent: () =>
      import('./pages/produit-detail/produit-detail.component')
        .then(m => m.ProduitDetailComponent),
  },

  // ───────────── Admin (Grouped + Protected) ─────────────

  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin/admin.component')
            .then(m => m.AdminComponent),
      },
      {
        path: 'boutiques',
        loadComponent: () =>
          import('./pages/admin-boutique/admin-boutique.component')
            .then(m => m.AdminBoutiqueComponent),
      },
      {
        path: 'boutiques/add',
        loadComponent: () =>
          import('./pages/boutique-form/boutique-form.component')
            .then(m => m.BoutiqueFormComponent),
      },
      {
        path: 'boutiques/:id/edit',
        loadComponent: () =>
          import('./pages/boutique-form/boutique-form.component')
            .then(m => m.BoutiqueFormComponent),
      },
      {
        path: 'promotions',
        loadComponent: () =>
          import('./pages/manager-promotion/manager-promotion.component')
            .then(m => m.ManagerPromotionComponent),
      },
    ],
  },

  // ───────────── Client (Grouped + Protected) ─────────────

  {
    path: 'client',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'client' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/client/client.component')
            .then(m => m.ClientComponent),
      },
      {
        path: 'commandes',
        loadComponent: () =>
          import('./pages/client-commande/client-commande.component')
            .then(m => m.ClientCommandeComponent),
      },
      {
        path: 'commandes/:id',
        loadComponent: () =>
          import('./pages/commande-detail/commande-detail.component')
            .then(m => m.CommandeDetailComponent),
      },
      {
        path: 'commandes/confirm/:token',
        loadComponent: () =>
          import('./pages/confirmation-commande/confirmation-commande.component')
            .then(m => m.CommandeConfirmationComponent),
      },
      {
        path: 'favoris',
        loadComponent: () =>
          import('./pages/favoris/favoris.component')
            .then(m => m.FavorisComponent),
      },
    ],
  },

  {
    path: 'profil',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/me/me.component')
        .then(m => m.MeComponent),
  },

  {
    path: 'panier',
    loadComponent: () =>
      import('./pages/panier/panier.component')
        .then(m => m.PanierComponent),
  },

  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
  },

  // ───────────── 404 ─────────────

  {
    path: '**',
    redirectTo: '',
  },

];