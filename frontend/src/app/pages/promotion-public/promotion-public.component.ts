import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PromotionService } from '../../services/promotion.service';
import { TypePromotion, Promotion, StatutPromotion } from '../../models/promotion.model';

type FilterTab = 'all' | TypePromotion | 'flash';
@Component({
  selector: 'app-promotion-public',
  standalone:true,
  imports: [CommonModule, RouterModule],
  templateUrl: './promotion-public.component.html',
  styleUrl: './promotion-public.component.scss'
})
export class PromotionPublicComponent implements OnInit, OnDestroy {
promotions: Promotion[] = [];
  filtered: Promotion[] = [];
  loading = true;
  activeFilter: FilterTab = 'all';
  toast: { message: string; type: 'success' | 'info' } | null = null;
  mobileMenuOpen = false;
  private toastTimer: any;

  // Countdown pour la promo expirant le plus tôt
  countdown = { h: '00', m: '00', s: '00' };
  flashPromo: Promotion | null = null;
  private countdownInterval: any;

  readonly filters: { key: FilterTab; label: string }[] = [
    { key: 'all',         label: 'Toutes'       },
    { key: 'flash',       label: 'Flash'        },
    { key: 'pourcentage', label: 'Pourcentage'  },
    { key: 'fixe',        label: 'Montant fixe' },
  ];

  copiedCodes = new Set<string>();
  favorites   = new Set<string>();

  constructor(private promotionService: PromotionService) {}

  ngOnInit(): void {
    this.promotionService.getActivePromotions().subscribe({
      next: (res) => {
        this.promotions = res.promotions;
        this.applyFilter();
        this.loading = false;
        this.initFlashCountdown();
      },
      error: () => { this.loading = false; }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownInterval);
    clearTimeout(this.toastTimer);
  }

  // ── Statut calculé depuis les dates ──────────────────────
  getStatut(p: Promotion): StatutPromotion {
    const now  = Date.now();
    const debut = new Date(p.dateDebut).getTime();
    const fin   = new Date(p.dateFin).getTime();
    if (!p.actif)    return 'suspendue';
    if (now < debut) return 'a_venir';
    if (now > fin)   return 'expiree';
    return 'active';
  }

  // "Flash" = expire dans moins de 6h
  isFlash(p: Promotion): boolean {
    const diff = new Date(p.dateFin).getTime() - Date.now();
    return diff > 0 && diff < 6 * 3600 * 1000;
  }

  // ── Filtres ───────────────────────────────────────────────
  applyFilter(): void {
    if (this.activeFilter === 'all') {
      this.filtered = this.promotions;
    } else if (this.activeFilter === 'flash') {
      this.filtered = this.promotions.filter(p => this.isFlash(p));
    } else {
      this.filtered = this.promotions.filter(p => p.type === this.activeFilter);
    }
  }

  setFilter(f: FilterTab): void {
    this.activeFilter = f;
    this.applyFilter();
  }

  // ── Copier le code ────────────────────────────────────────
  copyCode(code: string): void {
    navigator.clipboard.writeText(code).catch(() => {});
    this.copiedCodes.add(code);
    this.showToast(`Code ${code} copié dans le presse-papier !`, 'success');
    setTimeout(() => this.copiedCodes.delete(code), 2000);
  }

  toggleFav(id: string, event: Event): void {
    event.preventDefault();
    this.favorites.has(id) ? this.favorites.delete(id) : this.favorites.add(id);
  }

  // ── Usage bar ─────────────────────────────────────────────
  usagePercent(p: Promotion): number {
    if (!p.limiteUtilisation) return 0;
    return Math.min(100, Math.round((p.nombreUtilisations / p.limiteUtilisation) * 100));
  }

  usageRemaining(p: Promotion): number {
    if (!p.limiteUtilisation) return 0;
    return p.limiteUtilisation - p.nombreUtilisations;
  }

  // ── Affichage valeur ──────────────────────────────────────
  valueBig(p: Promotion): string {
    return p.type === 'fixe'
      ? `-${p.valeur.toLocaleString('fr')} Ar`
      : `-${p.valeur}%`;
  }

  isFixe(p: Promotion): boolean { return p.type === 'fixe'; }

  typeTagClass(p: Promotion): string {
    if (this.isFlash(p)) return 'ptt-flash';
    return p.type === 'pourcentage' ? 'ptt-pct' : 'ptt-amount';
  }

  typeTagLabel(p: Promotion): string {
    if (this.isFlash(p)) return '⚡ Flash sale';
    return p.type === 'pourcentage' ? '% Pourcentage' : '💰 Montant fixe';
  }

  statutClass(p: Promotion): string {
    return `statut-${this.getStatut(p)}`;
  }

  // ── Statistiques hero ─────────────────────────────────────
  get activeCount(): number {
    return this.promotions.filter(p => this.getStatut(p) === 'active').length;
  }

  get maxDiscount(): string {
    const pcts = this.promotions.filter(p => p.type === 'pourcentage').map(p => p.valeur);
    return pcts.length ? `-${Math.max(...pcts)}%` : '0%';
  }

  get flashCount(): number {
    return this.promotions.filter(p => this.isFlash(p)).length;
  }

  // ── Countdown (promo expirant le plus tôt) ────────────────
  private initFlashCountdown(): void {
    const flashPromos = this.promotions
      .filter(p => this.isFlash(p))
      .sort((a, b) => new Date(a.dateFin).getTime() - new Date(b.dateFin).getTime());

    this.flashPromo = flashPromos[0] ?? null;
    if (!this.flashPromo) return;

    const expiry = new Date(this.flashPromo.dateFin).getTime();
    this.countdownInterval = setInterval(() => {
      const diff = Math.max(0, expiry - Date.now());
      this.countdown = {
        h: Math.floor(diff / 3600000).toString().padStart(2, '0'),
        m: Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0'),
        s: Math.floor((diff % 60000) / 1000).toString().padStart(2, '0'),
      };
      if (diff === 0) clearInterval(this.countdownInterval);
    }, 1000);
  }

  showToast(message: string, type: 'success' | 'info' = 'info'): void {
    this.toast = { message, type };
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast = null), 2800);
  }
}
