import { ServerRoute, RenderMode } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [

  // Dynamic routes → client only
  {
    path: 'boutique/:slug',
    renderMode: RenderMode.Client
  },
  {
    path: 'produits/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/boutiques/:id/edit',
    renderMode: RenderMode.Client
  },
  {
    path: 'client/commandes/:id',
    renderMode: RenderMode.Client
  },

  // Everything else → prerender
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];