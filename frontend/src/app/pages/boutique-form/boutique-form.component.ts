import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Boutique, Categorie, CentreCommercial, Horaire } from '../../models/boutique.model';
import { BoutiqueService } from '../../services/boutique.service';
import { finalize, forkJoin, Subject, takeUntil } from 'rxjs';

export interface JourHoraire {
  key: string;   // 'lundi', 'mardi', …
  abbr: string;   // 'Lun'
  label: string;   // 'Lundi'
  weekend: boolean;
}

@Component({
  selector: 'app-boutique-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './boutique-form.component.html',
  styleUrl: './boutique-form.component.scss'
})
export class BoutiqueFormComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // ─── Mode édition ou création ──────────────────────────────────────────────
  isEditMode = false;
  boutiqueId = '';
  pageTitle = 'Nouvelle boutique';

  // ─── Onglets ───────────────────────────────────────────────────────────────
  activeTab = 0;
  tabs = [
    { label: 'Informations générales', number: 1 },
    { label: 'Informations détaillées', number: 2 },
    { label: 'Localisation', number: 3 },
    { label: 'Horaires', number: 4 },
  ];

  // ─── Référentiels ──────────────────────────────────────────────────────────
  categories: Categorie[] = [];
  centres: CentreCommercial[] = [];
  isLoadingRefs = false;

  // ─── Statuts disponibles ───────────────────────────────────────────────────
  statuts = [
    { value: 'active', label: 'Active', dot: 'dot-open' },
    { value: 'inactive', label: 'Inactive', dot: 'dot-closed' },
    { value: 'en_travaux', label: 'En travaux', dot: 'dot-conge' },
    { value: 'fermee_definitivement', label: 'Fermée définitivement', dot: 'dot-closed' },
  ];

  // ─── Jours de la semaine ───────────────────────────────────────────────────
  jours: JourHoraire[] = [
    { key: 'Lundi', abbr: 'Lun', label: 'Lundi', weekend: false },
    { key: 'Mardi', abbr: 'Mar', label: 'Mardi', weekend: false },
    { key: 'Mercredi', abbr: 'Mer', label: 'Mercredi', weekend: false },
    { key: 'Jeudi', abbr: 'Jeu', label: 'Jeudi', weekend: false },
    { key: 'Vendredi', abbr: 'Ven', label: 'Vendredi', weekend: false },
    { key: 'Samedi', abbr: 'Sam', label: 'Samedi', weekend: true },
    { key: 'Dimanche', abbr: 'Dim', label: 'Dimanche', weekend: true },
  ];

  // ─── Previews images ───────────────────────────────────────────────────────
  logoPreview: string | null = null;
  bannerPreview: string | null = null;
  logoFile: File | null = null;
  bannerFile: File | null = null;

  // ─── État UI ───────────────────────────────────────────────────────────────
  isSubmitting = false;
  submitSuccess = false;
  errorMessage = '';

  // ─── Formulaire ───────────────────────────────────────────────────────────
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private boutiqueService: BoutiqueService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  // ───────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm();
    this.loadReferentiels();

    // Détecter mode édition via :id dans la route
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.boutiqueId = id;
      this.pageTitle = 'Modifier la boutique';
      this.loadBoutique(id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Construction du formulaire ────────────────────────────────────────────
  private buildForm(): void {
    this.form = this.fb.group({
      // Onglet 1 — Infos générales
      nom: ['', [Validators.required, Validators.minLength(2)]],
      centreId: ['', Validators.required],
      categorieId: ['', Validators.required],
      statut: ['active', Validators.required],

      // Onglet 2 — Infos détaillées
      description: [''],
      telephone: [''],
      email: ['', Validators.email],
      site_web: [''],
      couleur: ['#2d4a3e'],
      couleur_hex: ['#2d4a3e'],
      superficie: [null],
      capacite_accueil: [null],
      // Réseaux sociaux
      facebook: [''],
      instagram: [''],
      twitter: [''],
      linkedin: [''],

      // Onglet 3 — Localisation
      etage: [''],
      numero_local: [''],
      zone: [''],
      latitude: [null],
      longitude: [null],

      // Onglet 4 — Horaires (FormArray)
      horaires: this.fb.array(this.buildHorairesDefaut()),
    });

    // Sync couleur ↔ couleur_hex
    this.form.get('couleur')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => this.form.get('couleur_hex')!.setValue(v, { emitEvent: false }));

    this.form.get('couleur_hex')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        if (/^#[0-9A-Fa-f]{6}$/.test(v))
          this.form.get('couleur')!.setValue(v, { emitEvent: false });
      });
  }

  // Horaires par défaut : 9h-18h du lun au ven, 10h-20h sam, 10h-18h dim
  private buildHorairesDefaut(): FormGroup[] {
    const defauts = [
      { ouverture: '09:00', fermeture: '18:00' }, // lun
      { ouverture: '09:00', fermeture: '18:00' }, // mar
      { ouverture: '09:00', fermeture: '18:00' }, // mer
      { ouverture: '09:00', fermeture: '18:00' }, // jeu
      { ouverture: '09:00', fermeture: '18:00' }, // ven
      { ouverture: '10:00', fermeture: '20:00' }, // sam
      { ouverture: '10:00', fermeture: '18:00' }, // dim
    ];
    return this.jours.map((j, i) =>
      this.fb.group({
        jour: [j.key],
        ouvert: [true],
        ouverture: [defauts[i].ouverture],
        fermeture: [defauts[i].fermeture],
        pause_actif: [false],
        pause_debut: ['12:00'],
        pause_fin: ['13:00'],
      })
    );
  }

  get horairesArray(): FormArray {
    return this.form.get('horaires') as FormArray;
  }

  horaireAt(i: number): FormGroup {
    return this.horairesArray.at(i) as FormGroup;
  }

  // ─── Chargement référentiels ───────────────────────────────────────────────
  private loadReferentiels(): void {
    this.isLoadingRefs = true;
    forkJoin({
      centres: this.boutiqueService.getCentres(),
      categories: this.boutiqueService.getCategories(),
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoadingRefs = false)
    ).subscribe({
      next: ({ centres, categories }) => {
        this.centres = this.toArray<CentreCommercial>(centres);
        this.categories = this.toArray<Categorie>(categories);
      },
      error: err => console.error('Erreur référentiels', err)
    });
  }

  // ─── Chargement boutique (mode édition) ────────────────────────────────────
  private loadBoutique(id: string): void {
    this.boutiqueService.getById(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: b => this.patchForm(b),
      error: err => {
        console.error('Erreur chargement boutique', err);
        this.errorMessage = 'Impossible de charger la boutique.';
      }
    });
  }

  private patchForm(b: Boutique): void {
    this.form.patchValue({
      nom: b.nom,
      centreId: b.centre_commercial._id,
      categorieId: b.categorie._id,
      statut: b.statut,
      description: b.infos.description,
      telephone: b.infos.telephone,
      email: b.infos.email,
      site_web: b.infos.site_web ?? '',
      couleur: b.categorie.couleur,
      couleur_hex: b.categorie.couleur,
      superficie: b.infos.superficie ?? null,
      capacite_accueil: b.infos.capacite_accueil ?? null,
      facebook: b.infos.reseaux_sociaux?.facebook ?? '',
      instagram: b.infos.reseaux_sociaux?.instagram ?? '',
      twitter: b.infos.reseaux_sociaux?.twitter ?? '',
      linkedin: b.infos.reseaux_sociaux?.linkedin ?? '',
      etage: b.localisation.etage,
      numero_local: b.localisation.numero_local,
      zone: b.localisation.zone ?? '',
    });

    // Patch horaires
    if (b.horaires?.length) {
      b.horaires.forEach((h, i) => {
        if (i < this.horairesArray.length) {
          this.horaireAt(i).patchValue({
            ouvert: h.ouvert,
            ouverture: h.heures.ouverture,
            fermeture: h.heures.fermeture,
            pause_actif: h.pause_dejeuner.actif,
            pause_debut: h.pause_dejeuner.debut ?? '12:00',
            pause_fin: h.pause_dejeuner.fin ?? '13:00',
          });
        }
      });
    }

    // Previews
    if (b.infos.logo_url) this.logoPreview = b.infos.logo_url;
  }

  // ─── Navigation onglets ────────────────────────────────────────────────────
  switchTab(index: number): void {
    this.activeTab = index;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─── Upload images ─────────────────────────────────────────────────────────
  onLogoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.logoFile = file;
    const reader = new FileReader();
    reader.onload = e => this.logoPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  onBannerChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.bannerFile = file;
    const reader = new FileReader();
    reader.onload = e => this.bannerPreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  // ─── Construction du payload ───────────────────────────────────────────────
  private buildPayload(): Partial<Boutique> {
    const v = this.form.value;

    const horaires: Horaire[] = this.horairesArray.controls.map((ctrl, i) => {
      const h = ctrl.value;
      return {
        jour: this.jours[i].key,
        ouvert: h.ouvert,
        heures: { ouverture: h.ouverture, fermeture: h.fermeture },
        pause_dejeuner: {
          actif: h.pause_actif,
          debut: h.pause_actif ? h.pause_debut : undefined,
          fin: h.pause_actif ? h.pause_fin : undefined,
        }
      };
    });

    return {
      nom: v.nom,
      statut: v.statut,
      // IDs uniquement — le backend résout les objets
      centre_commercial: { _id: v.centreId } as any,
      categorie: { _id: v.categorieId, couleur: v.couleur } as any,
      localisation: {
        etage: v.etage,
        numero_local: v.numero_local,
        zone: v.zone || undefined,
      },
      infos: {
        description: v.description,
        telephone: v.telephone,
        email: v.email,
        site_web: v.site_web || undefined,
        superficie: v.superficie ?? undefined,
        capacite_accueil: v.capacite_accueil ?? undefined,
        reseaux_sociaux: {
          facebook: v.facebook || undefined,
          instagram: v.instagram || undefined,
          twitter: v.twitter || undefined,
          linkedin: v.linkedin || undefined,
        }
      },
      horaires,
    };
  }

  // ─── Soumission ────────────────────────────────────────────────────────────
  isFieldInvalid(path: string): boolean {
    const ctrl = this.form.get(path);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      // Aller à l'onglet avec la première erreur
      if (this.form.get('nom')?.invalid || this.form.get('centreId')?.invalid || this.form.get('categorieId')?.invalid) {
        this.switchTab(0);
      } else if (this.form.get('email')?.invalid) {
        this.switchTab(1);
      }
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    const payload = this.buildPayload();

    const call$ = this.isEditMode
      ? this.boutiqueService.update(this.boutiqueId, payload)
      : this.boutiqueService.create(payload);

    call$.pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => {
        this.submitSuccess = true;
        setTimeout(() => this.router.navigate(['/admin/boutiques']), 1500);
      },
      error: err => {
        console.error('Erreur enregistrement', err);
        this.errorMessage = err?.error?.message ?? 'Erreur lors de l\'enregistrement.';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/boutiques']);
  }

  // ─── Helper ───────────────────────────────────────────────────────────────
  private toArray<T>(res: any): T[] {
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.items && Array.isArray(res.items)) return res.items;
    return [];
  }
}
