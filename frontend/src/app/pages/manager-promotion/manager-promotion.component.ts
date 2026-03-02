import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Promotion, PromotionStats, StatutPromotion, CreatePromotionDto } from '../../models/promotion.model';
import { PromotionService } from '../../services/promotion.service';

type FiltreActif = 'all' | 'active' | 'a_venir' | 'expiree';

@Component({
  selector: 'app-manager-promotion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './manager-promotion.component.html',
  styleUrl: './manager-promotion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerPromotionComponent implements OnInit{
  promotions = signal<Promotion[]>([]);
  loading = signal(false);
  modalOpen = signal(false);
  submitting = signal(false);
  searchQuery = '';
  filtreActif: FiltreActif = 'all';
  toast: { message: string; type: 'success' | 'error' | '' } | null = null;
  private toastTimer: any;

  // Form 
  promoForm!: FormGroup;
  typeSelected: 'pourcentage' | 'fixe' = 'pourcentage';

  //  Computed
  stats = computed<PromotionStats>(() => {
    const list = this.promotions();
    return {
      total: list.length,
      actives: list.filter((p) => this.getStatut(p) === 'active').length,
      aVenir: list.filter((p) => this.getStatut(p) === 'a_venir').length,
      expirees: list.filter((p) => this.getStatut(p) === 'expiree').length,
    };
  });

  filteredPromotions = computed<Promotion[]>(() => {
    let list = this.promotions();

    if (this.filtreActif !== 'all') {
      list = list.filter((p) => this.getStatut(p) === this.filtreActif);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter((p) =>
        p.code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    return list;
  });

  constructor(
    private promotionService: PromotionService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPromotions();
  }

  // Init Form 
  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.promoForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{3,20}$/)]],
      description: ['', Validators.required],
      type: ['pourcentage', Validators.required],
      valeur: [null, [Validators.required, Validators.min(1)]],
      montantMinCommande: [0],
      remiseMax: [null],
      dateDebut: [today, Validators.required],
      dateFin: ['', Validators.required],
      limiteUtilisation: [null],
    });
  }

  // Load
  loadPromotions(): void {
    this.loading.set(true);
    this.promotionService.getActivePromotions().subscribe({
      next: (res) => {
        this.promotions.set(res.promotions);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Erreur lors du chargement des promotions', 'error');
      },
    });
  }

  // Statut
  getStatut(promo: Promotion): StatutPromotion {
    if (!promo.actif) return 'suspendue';
    const now = new Date();
    const debut = new Date(promo.dateDebut);
    const fin = new Date(promo.dateFin);
    if (now < debut) return 'a_venir';
    if (now > fin) return 'expiree';
    return 'active';
  }

  getStatutLabel(promo: Promotion): string {
    const map: Record<StatutPromotion, string> = {
      active: 'Active',
      a_venir: 'À venir',
      expiree: 'Expirée',
      suspendue: 'Suspendue',
    };
    return map[this.getStatut(promo)];
  }

  getStatutClass(promo: Promotion): string {
    const map: Record<StatutPromotion, string> = {
      active: 's-active',
      a_venir: 's-future',
      expiree: 's-expired',
      suspendue: 's-paused',
    };
    return map[this.getStatut(promo)];
  }

  getTypeLabel(promo: Promotion): string {
    return promo.type === 'pourcentage' ? '% Pourcentage' : 'Montant fixe';
  }

  getTypeClass(promo: Promotion): string {
    return promo.type === 'pourcentage' ? 'type-pct' : 'type-amount';
  }

  getValeurDisplay(promo: Promotion): string {
    return promo.type === 'pourcentage'
      ? `-${promo.valeur}%`
      : `-${promo.valeur.toLocaleString('fr-MG')} Ar`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  isDateExpiringSoon(dateStr: string): boolean {
    const fin = new Date(dateStr);
    const now = new Date();
    const diff = (fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  }

  // Filtres 
  setFiltre(f: FiltreActif): void {
    this.filtreActif = f;
    this.cdr.markForCheck();
  }

  onSearch(): void {
    this.cdr.markForCheck();
  }

  // Modal 
  openModal(): void {
    this.promoForm.reset({
      type: 'pourcentage',
      montantMinCommande: 0,
      dateDebut: new Date().toISOString().split('T')[0],
    });
    this.typeSelected = 'pourcentage';
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  // Type selection 
  selectType(type: 'pourcentage' | 'fixe'): void {
    this.typeSelected = type;
    this.promoForm.patchValue({ type });
  }

  get valeurSuffix(): string {
    return this.typeSelected === 'pourcentage' ? '%' : 'Ar';
  }

  // Auto-generate code 
  generateCode(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'PROMO';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    this.promoForm.patchValue({ code });
  }

  forceUppercase(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pos = input.selectionStart ?? input.value.length;
    input.value = input.value.toUpperCase();
    input.setSelectionRange(pos, pos);
    this.promoForm.patchValue({ code: input.value }, { emitEvent: false });
  }

  // Submit 
  submitPromotion(): void {
    if (this.promoForm.invalid) {
      this.promoForm.markAllAsTouched();
      this.showToast('Veuillez remplir tous les champs requis.', 'error');
      return;
    }

    const { dateDebut, dateFin } = this.promoForm.value;
    if (new Date(dateDebut) >= new Date(dateFin)) {
      this.showToast('La date de fin doit être après la date de début.', 'error');
      return;
    }

    this.submitting.set(true);
    const dto: CreatePromotionDto = {
      ...this.promoForm.value,
      limiteUtilisation: this.promoForm.value.limiteUtilisation || null,
      remiseMax: this.promoForm.value.remiseMax || null,
    };

    this.promotionService.createPromotion(dto).subscribe({
      next: (res) => {
        this.promotions.update((list) => [res.promotion, ...list]);
        this.submitting.set(false);
        this.closeModal();
        this.showToast('Promotion créée avec succès !', 'success');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message || 'Erreur lors de la création.';
        this.showToast(msg, 'error');
      },
    });
  }

  // Delete 
  deletePromotion(promo: Promotion): void {
    if (!confirm(`Supprimer la promotion "${promo.code}" ?`)) return;

    this.promotionService.deletePromotion(promo._id).subscribe({
      next: () => {
        this.promotions.update((list) => list.filter((p) => p._id !== promo._id));
        this.showToast('Promotion supprimée.', 'success');
        this.cdr.markForCheck();
      },
      error: () => this.showToast('Erreur lors de la suppression.', 'error'),
    });
  }

  // Copy code
  copyCode(code: string): void {
    navigator.clipboard
      .writeText(code)
      .then(() => this.showToast(`Code ${code} copié !`, 'success'))
      .catch(() => this.showToast(`Code : ${code}`, ''));
  }

  // Toast
  showToast(message: string, type: 'success' | 'error' | ''): void {
    clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => {
      this.toast = null;
      this.cdr.markForCheck();
    }, 2600);
  }

  // TrackBy 
  trackById(_: number, promo: Promotion): string {
    return promo._id;
  }

}
