import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { BoutiqueService } from '../../services/boutique.service';
import { Boutique, BoutiqueFilters } from '../../models/boutique.model';

@Component({
  selector: 'app-boutiques',
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers:[DecimalPipe],
  templateUrl: './boutique.component.html',
  styleUrls: ['./boutique.component.scss']
})
export class BoutiquesComponent implements OnInit, OnDestroy {

  boutiques: Boutique[] = [];
  loading = false;
  error = '';

  currentPage = 1;
  totalPages = 1;
  total = 0;
  limit = 9;
  hasNextPage = false;
  hasPrevPage = false;

  searchQuery = '';
  selectedCategorie = '';
  sortOrder = 'nom';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  categories = [
    { id: '699ec38b4891da0893fbcc00', nom: 'Mode & Accessoires', icone: '👗' },
    { id: '699ec38b4891da0893fbcc01', nom: 'Électronique & High-Tech', icone: '💻' },
    { id: '699ec38b4891da0893fbcc02', nom: 'Sport & Loisirs', icone: '⚽' },
    { id: '699ec38b4891da0893fbcc03', nom: 'Beauté & Bien-être', icone: '💄' },
    { id: '699ec38b4891da0893fbcc04', nom: 'Restauration', icone: '🍽️' },
    { id: '699ec38b4891da0893fbcc05', nom: 'Maison & Décoration', icone: '🏠' },
  ];

  constructor(private boutiqueService: BoutiqueService) { }

  ngOnInit(): void {
    this.loadBoutiques();
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadBoutiques();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBoutiques(): void {
    this.loading = true;
    this.error = '';

    const filters: BoutiqueFilters = {
      page: this.currentPage,
      limit: this.limit,
      sort: this.sortOrder,
      order: 'asc',
    };

    if (this.searchQuery.trim()) filters.search = this.searchQuery.trim();
    if (this.selectedCategorie) filters.categorieId = this.selectedCategorie;

    this.boutiqueService.getAll(filters).subscribe({
      next: (data) => {
        this.boutiques = data.boutiques;
        this.total = data.pagination.total;
        this.totalPages = data.pagination.totalPages;
        this.hasNextPage = data.pagination.hasNextPage;
        this.hasPrevPage = data.pagination.hasPrevPage;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Impossible de charger les boutiques. Veuillez réessayer.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onSearch(value: string): void {
    this.searchQuery = value;
    this.searchSubject.next(value);
  }

  onCategorieChange(categorieId: string): void {
    this.selectedCategorie = categorieId === this.selectedCategorie ? '' : categorieId;
    this.currentPage = 1;
    this.loadBoutiques();
  }

  onSortChange(sort: string): void {
    this.sortOrder = sort;
    this.currentPage = 1;
    this.loadBoutiques();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadBoutiques();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategorie = '';
    this.sortOrder = 'nom';
    this.currentPage = 1;
    this.loadBoutiques();
  }

  getInitiale(nom: string): string {
    return nom?.charAt(0).toUpperCase() || '?';
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      active: 'Ouvert',
      inactive: 'Fermé',
      en_travaux: 'En travaux',
      fermee_definitivement: 'Fermé'
    };
    return labels[statut] || statut;
  }

  isOpen(boutique: Boutique): boolean {
    return boutique.est_ouvert_maintenant === true || boutique.statut === 'active';
  }

  getPages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
}
