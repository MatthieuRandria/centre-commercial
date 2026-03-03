import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PromotionService } from '../../../services/promotion.service';
import { Promotion, CreatePromotionDto } from '../../../models/promotion.model';

export type PromotionStatut = 'active' | 'future' | 'expiree' | 'suspendue';
export type PromotionType = 'pourcentage' | 'fixe';

interface KpiData {
   total: number; actives: number; futures: number; expirees: number;
}

interface FilterTab {
   label: string;
   value: 'toutes' | PromotionStatut;
}

@Component({
   selector: 'app-manager-promotions',
   standalone: true,
   imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
   templateUrl: './promotion.component.html',
   styleUrls: ['./promotion.component.scss'],
})
export class ManagerPromotionsComponent implements OnInit {

   // ── Data ──────────────────────────────────────────────────────────────────
   promotions: Promotion[] = [];
   filteredPromotions: Promotion[] = [];
   kpi: KpiData = { total: 0, actives: 0, futures: 0, expirees: 0 };

   // ── UI state ──────────────────────────────────────────────────────────────
   loading = false;
   deleting = new Set<string>();
   activeTab = 0;
   searchTerm = '';
   modalOpen = false;
   modalMode: 'create' | 'edit' = 'create';
   editingId: string | null = null;
   submitting = false;
   confirmDeleteId: string | null = null;

   toastMessage = '';
   toastType: 'success' | 'error' | '' = '';
   toastVisible = false;
   private toastTimer: any;

   // ── Exposed for template ──────────────────────────────────────────────────
   Math = Math;

   // ── Config ────────────────────────────────────────────────────────────────
   filterTabs: FilterTab[] = [
      { label: 'Toutes', value: 'toutes' },
      { label: 'Actives', value: 'active' },
      { label: 'A venir', value: 'future' },
      { label: 'Expirees', value: 'expiree' },
      { label: 'Suspendues', value: 'suspendue' },
   ];

   typeOptions: { value: PromotionType; label: string; desc: string }[] = [
      { value: 'pourcentage', label: 'Pourcentage', desc: 'Ex: -20%' },
      { value: 'fixe', label: 'Montant fixe', desc: 'Ex: -10 000 Ar' },
   ];

   form!: FormGroup;

   constructor(
      private promoSvc: PromotionService,
      private fb: FormBuilder
   ) { }

   ngOnInit() {
      this.buildForm();
      this.loadPromotions();
   }

   // ── Form ──────────────────────────────────────────────────────────────────
   buildForm() {
      const today = new Date().toISOString().split('T')[0];
      this.form = this.fb.group({
         code: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Z0-9]+$/)]],
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

   get f() { return this.form.controls; }
   get selectedType() { return this.form.get('type')?.value as PromotionType; }

   // ── Load ──────────────────────────────────────────────────────────────────
   loadPromotions() {
      this.loading = true;
      this.promoSvc.getActivePromotions().subscribe({
         next: res => {
            this.promotions = res.promotions ?? [];
            this.applyFilter();
            this.computeKpi();
            this.loading = false;
         },
         error: () => {
            this.loading = false;
            this.showToast('Erreur lors du chargement', 'error');
         },
      });
   }

   computeKpi() {
      this.kpi.total = this.promotions.length;
      this.kpi.actives = this.promotions.filter(p => this.getStatut(p) === 'active').length;
      this.kpi.futures = this.promotions.filter(p => this.getStatut(p) === 'future').length;
      this.kpi.expirees = this.promotions.filter(p => this.getStatut(p) === 'expiree').length;
   }

   // ── Filter ────────────────────────────────────────────────────────────────
   selectTab(idx: number) {
      this.activeTab = idx;
      this.applyFilter();
   }

   onSearch() { this.applyFilter(); }

   applyFilter() {
      const tab = this.filterTabs[this.activeTab].value;
      let list = [...this.promotions];
      if (tab !== 'toutes') {
         list = list.filter(p => this.getStatut(p) === tab);
      }
      if (this.searchTerm.trim()) {
         const q = this.searchTerm.toLowerCase();
         list = list.filter(p =>
            p.code.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
         );
      }
      this.filteredPromotions = list;
   }

   tabCount(tab: FilterTab): number {
      if (tab.value === 'toutes') return this.promotions.length;
      return this.promotions.filter(p => this.getStatut(p) === tab.value).length;
   }

   // ── Modal ─────────────────────────────────────────────────────────────────
   openCreateModal() {
      this.modalMode = 'create';
      this.editingId = null;
      this.form.reset({ type: 'pourcentage', montantMinCommande: 0, dateDebut: new Date().toISOString().split('T')[0] });
      this.form.get('code')?.enable();
      this.modalOpen = true;
   }

   openEditModal(p: Promotion) {
      this.modalMode = 'edit';
      this.editingId = p._id;
      this.form.patchValue({
         code: p.code,
         description: p.description,
         type: p.type,
         valeur: p.valeur,
         montantMinCommande: p.montantMinCommande,
         remiseMax: p.remiseMax,
         dateDebut: p.dateDebut.split('T')[0],
         dateFin: p.dateFin.split('T')[0],
         limiteUtilisation: p.limiteUtilisation,
      });
      this.form.get('code')?.disable();
      this.modalOpen = true;
   }

   closeModal() { this.modalOpen = false; this.submitting = false; }

   // ── Submit ────────────────────────────────────────────────────────────────
   submitForm() {
      if (this.form.invalid) {
         this.form.markAllAsTouched();
         this.showToast('Veuillez remplir tous les champs requis', 'error');
         return;
      }
      const v = this.form.getRawValue();
      if (new Date(v.dateDebut) >= new Date(v.dateFin)) {
         this.showToast('La date de fin doit etre apres la date de debut', 'error');
         return;
      }
      this.submitting = true;
      const dto: CreatePromotionDto = {
         code: v.code,
         description: v.description,
         type: v.type,
         valeur: v.valeur,
         montantMinCommande: v.montantMinCommande ?? 0,
         remiseMax: v.remiseMax ?? null,
         dateDebut: v.dateDebut,
         dateFin: v.dateFin,
         limiteUtilisation: v.limiteUtilisation ?? null,
      };
      this.promoSvc.createPromotion(dto).subscribe({
         next: res => {
            this.promotions.unshift(res.promotion);
            this.applyFilter();
            this.computeKpi();
            this.closeModal();
            this.showToast('Promotion creee avec succes !', 'success');
         },
         error: err => {
            this.submitting = false;
            this.showToast(err.error?.message ?? 'Erreur lors de la creation', 'error');
         },
      });
   }

   // ── Delete ────────────────────────────────────────────────────────────────
   confirmDelete(id: string) { this.confirmDeleteId = id; }
   cancelDelete() { this.confirmDeleteId = null; }

   doDelete() {
      const id = this.confirmDeleteId;
      if (!id) return;
      this.confirmDeleteId = null;
      this.deleting.add(id);
      this.promoSvc.deletePromotion(id).subscribe({
         next: () => {
            this.promotions = this.promotions.filter(p => p._id !== id);
            this.applyFilter();
            this.computeKpi();
            this.deleting.delete(id);
            this.showToast('Promotion supprimee', 'success');
         },
         error: () => {
            this.deleting.delete(id);
            this.showToast('Erreur lors de la suppression', 'error');
         },
      });
   }

   isDeleting(id: string) { return this.deleting.has(id); }

   // ── Toggle pause (local — ajouter PATCH /promotions/:id/actif côté backend) ──
   togglePause(p: Promotion) {
      p.actif = !p.actif;
      this.applyFilter();
      this.computeKpi();
      this.showToast(p.actif ? 'Promotion activee' : 'Promotion suspendue', 'success');
   }

   // ── Helpers ───────────────────────────────────────────────────────────────
   getStatut(p: Promotion): PromotionStatut {
      if (!p.actif) return 'suspendue';
      const now = new Date();
      const debut = new Date(p.dateDebut);
      const fin = new Date(p.dateFin);
      if (now < debut) return 'future';
      if (now > fin) return 'expiree';
      return 'active';
   }

   statutLabel(s: PromotionStatut): string {
      const map: Record<PromotionStatut, string> = {
         active: 'Active', future: 'A venir', expiree: 'Expiree', suspendue: 'Suspendue',
      };
      return map[s];
   }

   valeurDisplay(p: Promotion): string {
      return p.type === 'pourcentage'
         ? `-${p.valeur}%`
         : `-${p.valeur.toLocaleString('fr-FR')} Ar`;
   }

   typeLabel(t: string): string {
      return t === 'pourcentage' ? 'Pourcentage' : 'Montant fixe';
   }

   limiteDisplay(p: Promotion): string {
      return p.limiteUtilisation !== null
         ? `${p.nombreUtilisations} / ${p.limiteUtilisation}`
         : `${p.nombreUtilisations} / illimite`;
   }

   formatDate(d: string): string {
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
   }

   isExpiringSoon(p: Promotion): boolean {
      const diff = (new Date(p.dateFin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 3;
   }

   generateCode() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = 'PROMO';
      for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
      this.form.get('code')?.setValue(code);
   }

   copyCode(code: string) {
      navigator.clipboard.writeText(code)
         .then(() => this.showToast(`Code ${code} copie !`, 'success'))
         .catch(() => this.showToast(`Code : ${code}`, ''));
   }

   showToast(msg: string, type: 'success' | 'error' | '') {
      this.toastMessage = msg;
      this.toastType = type;
      this.toastVisible = true;
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => (this.toastVisible = false), 2800);
   }

   onCodeInput(event: Event) {
      const input = event.target as HTMLInputElement;
      input.value = input.value.toUpperCase();
      this.form.get('code')?.setValue(input.value, { emitEvent: false });
   }
}