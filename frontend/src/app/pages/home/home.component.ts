import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);

  // Carousel
  currentSlide = 0;
  private timer: any;

  // Search
  searchQuery = '';
  searchFocused = false;
  searchTags = ['Robe', 'Sneakers', 'iPhone', 'Parfum', 'Jean', 'Sac', 'Montre'];

  // Categories — chargées dynamiquement depuis /boutiquesCateg
  categories: any[] = [];
  loadingCategories = true;

  // Data
  produits: any[] = [];
  boutiques: any[] = [];
  loadingProduits = true;
  loadingBoutiques = true;

  ngOnInit(): void {
    this.loadData();
    if (isPlatformBrowser(this.platformId)) {
      this.timer = setInterval(() => this.moveSlide(1), 4500);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  loadData(): void {
    this.http.get<any>('http://localhost:3000/boutiquesCateg?active=true&limit=20').subscribe({
      next: (res) => {
        this.categories = res.data || [];
        this.loadingCategories = false;
      },
      error: () => { this.loadingCategories = false; }
    });

    this.http.get<any>('http://localhost:3000/produits?limit=8').subscribe({
      next: (res) => {
        this.produits = res.data || [];
        this.loadingProduits = false;
      },
      error: () => { this.loadingProduits = false; }
    });

    this.http.get<any>('http://localhost:3000/boutiques?limit=6').subscribe({
      next: (res) => {
        this.boutiques = res.data?.boutiques || res.boutiques || res.data || [];
        this.loadingBoutiques = false;
      },
      error: () => { this.loadingBoutiques = false; }
    });
  }

  goSlide(n: number): void {
    this.currentSlide = (n + 3) % 3;
  }

  moveSlide(d: number): void {
    this.goSlide(this.currentSlide + d);
  }

  pauseCarousel(): void {
    if (this.timer) clearInterval(this.timer);
  }

  resumeCarousel(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.timer = setInterval(() => this.moveSlide(1), 4500);
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/produits'], { queryParams: { q: this.searchQuery } });
    }
  }

  searchByTag(tag: string): void {
    this.router.navigate(['/produits'], { queryParams: { q: tag } });
  }

  getInitiale(nom: string): string {
    return nom?.charAt(0).toUpperCase() || '?';
  }
}