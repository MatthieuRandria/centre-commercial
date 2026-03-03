import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavSection {
   label: string;
   items: NavItem[];
}

interface NavItem {
   label: string;
   link: string;
   tip: string;
   badge?: number;
   icon: string;
}

@Component({
   selector: 'app-sidebar',
   standalone: true,
   imports: [CommonModule, RouterModule, RouterLinkActive],
   templateUrl: './sidebar.component.html',
   styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {

   /** Notifie le parent (AppComponent) du changement d'état */
   @Output() collapsedChange = new EventEmitter<boolean>();

   user: any = null;
   collapsed: boolean = false;

   sections: NavSection[] = [
      {
         label: 'Principal',
         items: [
            { label: 'Dashboard', link: '/admin', tip: 'Dashboard', icon: 'dashboard' },
            { label: 'Boutiques', link: '/admin/boutiques', tip: 'Boutiques', icon: 'boutique' },
            // { label: 'Produits', link: '/admin/produits', tip: 'Produits', icon: 'produit' },
            // { label: 'Commandes', link: '/admin/commandes', tip: 'Commandes', icon: 'commande', badge: 0 },
         ]
      },
      {
         label: 'Gestion',
         items: [
            // { label: 'Utilisateurs', link: '/admin/utilisateurs', tip: 'Utilisateurs', icon: 'user' },
            { label: 'Evenements', link: '/admin/evenements', tip: 'Evenements', icon: 'evenement' },
            // { label: 'Promotions', link: '/admin/promotions', tip: 'Promotions', icon: 'promotion' },
         ]
      },
      {
         label: 'Systeme',
         items: [
            { label: 'Parametres', link: '/admin/parametres', tip: 'Parametres', icon: 'parametre' },
            { label: 'Statistiques', link: '/admin/statistiques', tip: 'Statistiques', icon: 'stats' },
         ]
      }
   ];

   get initials(): string {
      const name = this.user?.nom || this.user?.name || '';
      const parts = name.trim().split(' ');
      return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'A';
   }

   get shortName(): string {
      const name = this.user?.nom || this.user?.name || '';
      const parts = name.trim().split(' ');
      return parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '') || 'Admin';
   }

   get role(): string {
      return this.user?.role || 'Super Admin';
   }

   constructor(private authService: AuthService, private router: Router) {
      this.authService.currentUser$.subscribe(user => {
         this.user = user;
      });
   }

   ngOnInit(): void {
      this.user = this.authService.getCurrentUser();
   }

   toggleCollapse(): void {
      this.collapsed = !this.collapsed;
      this.collapsedChange.emit(this.collapsed);
   }

   logout(): void {
      this.authService.logout();
      this.router.navigate(['/login']);
   }
}