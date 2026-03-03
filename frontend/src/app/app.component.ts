import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, SidebarComponent],
  template: `
    <!-- Navbar : visible partout SAUF sur les routes admin -->
    <app-navbar *ngIf="showNavbar"></app-navbar>

    <!-- Layout admin : sidebar fixe + contenu scrollable -->
    <div class="admin-layout" *ngIf="isAdminRoute">
      <app-sidebar (collapsedChange)="onSidebarToggle($event)"></app-sidebar>
      <div class="admin-content" [class.sidebar-collapsed]="sidebarCollapsed">
        <router-outlet></router-outlet>
      </div>
    </div>

    <!-- Layout normal (non-admin) -->
    <router-outlet *ngIf="!isAdminRoute"></router-outlet>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
    }

    /* Le contenu principal s'adapte à la largeur de la sidebar */
    .admin-content {
      flex: 1;
      min-width: 0;
      margin-left: 248px;
      transition: margin-left 0.32s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .admin-content.sidebar-collapsed {
      margin-left: 64px;
    }
  `]
})
export class AppComponent implements OnInit {

  showNavbar = true;
  isAdminRoute = false;
  sidebarCollapsed = false;

  private readonly adminPrefixes = ['/admin'];

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.updateLayout(e.urlAfterRedirects ?? e.url);
    });

    this.updateLayout(this.router.url);
  }

  private updateLayout(url: string): void {
    const user = this.authService.getCurrentUser();
    const isAdmin = user?.role === 'admin';
    const onAdminRoute = this.adminPrefixes.some(p => url.startsWith(p));

    this.isAdminRoute = onAdminRoute && isAdmin;
    this.showNavbar = !this.isAdminRoute;
  }

  /** Appelé par SidebarComponent via Output pour synchroniser le margin */
  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }
}