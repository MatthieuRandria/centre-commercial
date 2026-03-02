import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  link?: string;
  action?: () => void;
  dropdown?: NavItem[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {

  user: any = null;
  navItems: NavItem[] = [];
  toggleMobileMenu = false;
  userMenuOpen = false;

  get initials(): string {
    const name = this.user?.nom || this.user?.name || '';
    const parts = name.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  get shortName(): string {
    const name = this.user?.nom || this.user?.name || '';
    const parts = name.trim().split(' ');
    return parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : '');
  }

  constructor(private authService: AuthService, private router: Router) {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.buildNavItems();
    });
  }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.buildNavItems();
  }

  buildNavItems(): void {
    // Liens toujours visibles
    this.navItems = [
      { label: 'Accueil', link: '/' },
      { label: 'Boutiques', link: '/boutique' },
      { label: 'Contact', link: '/contact' },
    ];

    // Liens visibles uniquement si connecté en tant que client
    if (this.user?.role === 'client') {
      this.navItems.splice(2, 0,
        { label: 'Panier', link: '/panier' },
        { label: 'Mes commandes', link: '/commandes' },
        { label: 'Mes favoris', link: '/favoris' }
      );
    }
    // Liens visibles uniquement si connecté en tant qu'admin
    if (this.user?.role === 'admin') {
      this.navItems.splice(2, 0,
        { label: 'Admin', link: '/admin' },
        { label: 'Gerer Boutique', link: '/admin/boutiques' },
      );
    }
  }

  navigate(link?: string): void {
    if (!link) return;
    this.router.navigate([link.startsWith('/') ? link : '/' + link]);
  }

  logout(): void {
    this.userMenuOpen = false;
    this.toggleMobileMenu = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Ferme le dropdown user au clic extérieur
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.userMenuOpen = false;
    }
  }
}