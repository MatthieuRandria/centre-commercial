import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BoutiqueService } from '../../services/boutique.service';
import {   Boutique, BoutiqueFilters,Categorie, CentreCommercial } from '../../models/boutique.model';
import { debounceTime, distinctUntilChanged, finalize, forkJoin, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-boutique',
  standalone:true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-boutique.component.html',
  styleUrl: './admin-boutique.component.scss'
})
export class AdminBoutiqueComponent implements OnInit, OnDestroy {

private destroy$ = new Subject<void>();

  filterForm!: FormGroup;

  // ─── Données ───────────────────────────────────────────────────────────────
  boutiques:  Boutique[]         = [];
  categories: Categorie[]        = [];
  centres:    CentreCommercial[] = [];

  statuts = [
    { value: 'active',                label: 'Active'                },
    { value: 'inactive',              label: 'Inactive'              },
    { value: 'en_travaux',            label: 'En travaux'            },
    { value: 'fermee_definitivement', label: 'Fermée définitivement' },
  ];

  // ─── Pagination server-side ────────────────────────────────────────────────
  pagination = {
    total: 0, page: 1, limit: 10,
    totalPages: 1, hasNextPage: false, hasPrevPage: false
  };
  // router: any;

  get pageNumbers(): number[] {
    const range = 2;
    const start = Math.max(1, this.pagination.page - range);
    const end   = Math.min(this.pagination.totalPages, this.pagination.page + range);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  get showFrom(): number {
    return this.boutiques.length === 0
      ? 0
      : (this.pagination.page - 1) * this.pagination.limit + 1;
  }
  get showTo(): number {
    return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total);
  }

  // ─── État UI ───────────────────────────────────────────────────────────────
  isLoading        = false;
  isLoadingRefs    = false;
  errorMessage     = '';
  deleteModalOpen  = false;
  deleteTargetName = '';
  private deleteTargetId = '';

  constructor(
    private fb: FormBuilder,
    private boutiqueService: BoutiqueService,
    private router: Router
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm();
    this.loadReferentiels();
    this.loadBoutiques();
    this.setupFilterListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Formulaire ───────────────────────────────────────────────────────────
  private buildForm(): void {
    this.filterForm = this.fb.group({
      // centreId et categorieId démarrés disabled tant que les refs ne sont pas chargées
      centreId:    [{ value: '', disabled: true }],
      categorieId: [{ value: '', disabled: true }],
      statut:      [''],
      search:      [''],
      sort:        ['createdAt'],
      order:       ['desc'],
      noteMin:     [''],
    });
  }

  private setupFilterListeners(): void {
    // Debounce 400 ms sur le champ texte
    this.filterForm.get('search')!.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.onFilterChange());

    // Réaction immédiate sur tous les selects
    ['centreId', 'categorieId', 'statut', 'sort', 'order', 'noteMin'].forEach(ctrl => {
      this.filterForm.get(ctrl)!.valueChanges.pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe(() => this.onFilterChange());
    });
  }

  // ─── Référentiels (centres + catégories en parallèle) ─────────────────────
  private loadReferentiels(): void {
    this.isLoadingRefs = true;

    forkJoin({
      centres:    this.boutiqueService.getCentres(),
      categories: this.boutiqueService.getCategories(),
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoadingRefs = false;
        // Activer les selects après chargement (ou même en cas d'erreur)
        this.filterForm.get('centreId')!.enable();
        this.filterForm.get('categorieId')!.enable();
      })
    ).subscribe({
      next: ({ centres, categories }) => {
        // Normalise la réponse : certaines APIs enveloppent dans { data: [...] }
        this.centres    = this.toArray(centres);
        this.categories = this.toArray(categories);
      },
      error: err => {
        // Non bloquant : les selects restent vides mais la liste fonctionne
        console.error('Erreur chargement référentiels', err);
        this.centres    = [];
        this.categories = [];
      }
    });
  }

  /** Garantit un tableau quelle que soit la forme de la réponse API */
  private toArray<T>(response: any): T[] {
    if (Array.isArray(response))          return response as T[];
    if (response?.data && Array.isArray(response.data)) return response.data as T[];
    if (response?.items && Array.isArray(response.items)) return response.items as T[];
    console.warn('Réponse API inattendue, tableau vide utilisé :', response);
    return [];
  }

  // ─── Chargement boutiques via API ─────────────────────────────────────────
  loadBoutiques(): void {
    this.isLoading    = true;
    this.errorMessage = '';

    this.boutiqueService.getAll(this.buildFilters()).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: res => {
        this.boutiques  = res.boutiques;
        this.pagination = res.pagination;
      },
      error: err => {
        console.error('Erreur chargement boutiques', err);
        this.errorMessage = 'Impossible de charger les boutiques. Veuillez réessayer.';
        this.boutiques    = [];
      }
    });
  }

  private buildFilters(): BoutiqueFilters {
    const v = this.filterForm.value;
    const f: BoutiqueFilters = {
      page:  this.pagination.page,
      limit: this.pagination.limit,
    };
    if (v.centreId)    f.centreId    = v.centreId;
    if (v.categorieId) f.categorieId = v.categorieId;
    if (v.statut)      f.statut      = v.statut;
    if (v.search)      f.search      = v.search;
    if (v.sort)        f.sort        = v.sort;
    if (v.order)       f.order       = v.order;
    if (v.noteMin)     f.noteMin     = +v.noteMin;
    return f;
  }

  // ─── Filtres / pagination ─────────────────────────────────────────────────
  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadBoutiques();
  }

  resetFilters(): void {
    this.filterForm.reset({
      centreId: '', categorieId: '', statut: '',
      search: '', sort: 'createdAt', order: 'desc', noteMin: ''
    });
    this.pagination.page = 1;
    this.loadBoutiques();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination.totalPages) return;
    this.pagination.page = page;
    this.loadBoutiques();
  }

  // ─── Actions boutique ─────────────────────────────────────────────────────
  viewBoutique(b: Boutique): void {
    // this.router.navigate(['/admin/boutiques', b._id]);
    console.log('Voir boutique', b._id);
  }

  editBoutique(b: Boutique): void {
    this.router.navigate(['/admin/boutiques', b._id, 'edit']);
    // console.log('Modifier boutique', b._id);
  }

  openDeleteModal(b: Boutique): void {
    this.deleteTargetName = b.nom;
    this.deleteTargetId   = b._id;
    this.deleteModalOpen  = true;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
  }

  confirmDelete(): void {
    this.boutiqueService.delete(this.deleteTargetId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.closeDeleteModal();
        // Si on vide la dernière page, reculer d'une page
        if (this.boutiques.length === 1 && this.pagination.page > 1) {
          this.pagination.page--;
        }
        this.loadBoutiques();
      },
      error: err => {
        console.error('Erreur suppression', err);
        this.errorMessage = 'Erreur lors de la suppression. Veuillez réessayer.';
        this.closeDeleteModal();
      }
    });
  }

  // ─── Export CSV ───────────────────────────────────────────────────────────
  exportCsv(): void {
    // Option A — export via l'endpoint API (recommandé pour les gros volumes) :
    // this.boutiqueService.exportCsv(this.buildFilters()).subscribe(blob => {
    //   const url = URL.createObjectURL(blob);
    //   const a = document.createElement('a');
    //   a.href = url; a.download = `boutiques_${new Date().toISOString().slice(0, 10)}.csv`;
    //   a.click(); URL.revokeObjectURL(url);
    // });

    // Option B — génération locale depuis les données de la page courante :
    const headers = [
      'ID', 'Nom', 'Slug', 'Catégorie', 'Centre', 'Ville',
      'Étage', 'Local', 'Zone', 'Statut',
      'Note', 'Avis', 'Vues', 'Favoris', 'Créé le'
    ];
    const rows = this.boutiques.map(b => [
      b._id, b.nom, b.slug,
      b.categorie.nom,
      b.centre_commercial.nom,
      b.centre_commercial.adresse.ville,
      b.localisation.etage,
      b.localisation.numero_local,
      b.localisation.zone ?? '',
      b.statut,
      b.note_moyenne,
      b.nombre_avis,
      b.nombre_vues,
      b.nombre_favoris,
      this.formatDate(b.createdAt)
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));

    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `boutiques_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  openAddModal(): void {
    this.router.navigate(['/admin/boutiques/add']);
    // console.log('Ajouter boutique');
  }

  // ─── Helpers d'affichage ──────────────────────────────────────────────────
  statutLabel(statut: string): string {
    const map: Record<string, string> = {
      active:                'Active',
      inactive:              'Inactive',
      en_travaux:            'En travaux',
      fermee_definitivement: 'fermee_definitivement'
    };
    return map[statut] ?? statut;
  }

  statutClass(statut: string): string {
    const map: Record<string, string> = {
      active:                'status-active',
      inactive:              'status-inactive',
      en_travaux:            'status-travaux',
      fermee_definitivement: 'status-fermee'
    };
    return map[statut] ?? '';
  }

  getInitial(nom: string): string {
    return nom.charAt(0).toUpperCase();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  renderStars(note: number): string {
    const r = Math.round(note);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }
}
