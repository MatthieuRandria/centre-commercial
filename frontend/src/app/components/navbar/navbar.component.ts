import { Component, OnInit } from '@angular/core';
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
  templateUrl: "./navbar.component.html",
  styleUrl:"./navbar.component.scss"
})

export class NavbarComponent implements OnInit{
  user: any = null;
  navItems: NavItem[]=[];
  toggleMobileMenu: boolean = false;

  ngOnInit(): void {
    this.loadUser();
  }
  
  constructor(private authService: AuthService, private router: Router) {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  navigate(link?: string) {
    if (!link) return;
    // ajoute "/" si ce n'est pas un chemin absolu
    const path = link.startsWith('/') ? link : '/' + link;
    this.router.navigate([path]);
  }

  loadUser() {
    this.user = this.authService.getCurrentUser();
    this.buildNavItems();
  }

  buildNavItems() {
    if (!this.user) {
      // Utilisateur non connecté
      this.navItems = [
        { label: 'Accueil', link: '/' },
        { label: 'Login', link: '/login' },
        { label: 'Signup', link: '/signup' }
      ];
    } else {
      switch (this.user.role) {
        case "client":
          this.navItems = [
            { label: 'Accueil', link: '/' },
            { label: 'Panier', link: '/cart' },
            { label: 'Favoris', link: '/favorites' },
            { label: 'Profil', link: '/profile' },
            { label: 'Déconnexion', action: () => this.logout() }
          ];
          break;
        case "boutique":
          this.navItems = [
            { label: 'Accueil', link: '/' },
            { label: 'Dashboard', link: '/dashboard' },
            { label: 'Profil', link: '/profile' },
            { label: 'Déconnexion', action: () => this.logout() }
          ];
          break;
        case "admin":
          this.navItems = [
            { label: 'Dashboard', link: '/dashboard' },
            { label: 'Utilisateurs', link: '/users' },
            { label: 'Boutiques', link: '/shops' },
            { label: 'Déconnexion', action: () => this.logout() }
          ];
          break;
        default:
          this.navItems = [{ label: 'Accueil', link: '/' }];
      }
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isLoggedIn() {
    return !!localStorage.getItem('token');
  }

}
