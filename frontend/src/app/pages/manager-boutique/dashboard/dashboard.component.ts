// manager-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { BoutiqueService } from '../../../services/boutique.service';
import { environment } from '../../../../environments/environment';

interface KpiData {
   commandesEnCours: number;
   commandesEnAttente: number;
   produitsRupture: number;
   stockTotal: number;
   totalProduits: number;
}

interface CommandeRecente {
   _id: string;
   numeroCommande: string;
   acheteur: { nom: string; prenom?: string };
   total: number;
   statut: string;
   createdAt: string;
}

interface TopProduit {
   _id: string;
   nom: string;
   stock: number;
}

interface ProduitRupture {
   _id: string;
   nom: string;
   categories: { nom: string }[];
}

interface VentesPoint {
   date: string;
   montant: number;
}

@Component({
   selector: 'app-manager-dashboard',
   standalone: true,
   imports: [CommonModule, RouterModule, DecimalPipe, DatePipe],
   templateUrl: './dashboard.component.html',
   styleUrl: './dashboard.component.scss'
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {

   private readonly API = environment.apiUrl;
   private destroy$ = new Subject<void>();

   boutiqueId = '';
   boutiqueName = '';
   userName = '';
   today = new Date();
   isLoading = true;

   kpi: KpiData = {
      commandesEnCours: 0,
      commandesEnAttente: 0,
      produitsRupture: 0,
      stockTotal: 0,
      totalProduits: 0
   };

   commandesRecentes: CommandeRecente[] = [];
   topProduits: TopProduit[] = [];
   produitsRupture: ProduitRupture[] = [];
   ventesData: VentesPoint[] = [];

   // Chart SVG
   chartPoints: { x: number; y: number; date: string; montant: number }[] = [];
   chartWidth = 700;
   chartHeight = 160;
   chartPath = '';
   chartFill = '';

   readonly statutLabels: Record<string, string> = {
      en_attente: 'En attente',
      validee: 'Validée',
      preparee: 'En préparation',
      expediee: 'Expédiée',
      livree: 'Livrée',
      annulee: 'Annulée'
   };

   constructor(
      private http: HttpClient,
      private router: Router,
      private authService: AuthService,
      private boutiqueService: BoutiqueService
   ) { }

   ngOnInit(): void {
      const user = this.authService.getCurrentUser();
      this.userName = user?.prenom || user?.nom || 'Manager';
      const userId = user?._id || user?.id || '';

      if (userId) {
         this.boutiqueService.getBoutiquesByUser(userId).subscribe({
            next: (boutiques: any[]) => {
               if (boutiques.length > 0) {
                  this.boutiqueId = boutiques[0]._id;
                  this.boutiqueName = boutiques[0].nom;
               }
               this.loadAll();
            },
            error: () => this.loadAll()
         });
      } else {
         this.loadAll();
      }
   }

   ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
   }

   private headers(): HttpHeaders {
      const token = localStorage.getItem('token') || '';
      return new HttpHeaders({ Authorization: `Bearer ${token}` });
   }

   private loadAll(): void {
      this.isLoading = true;
      const h = { headers: this.headers() };
      const bq = this.boutiqueId;

      forkJoin({
         commandes: this.http.get<any>(
            `${this.API}/commande/boutique/${bq}?limit=5&order=desc`, h
         ).pipe(catchError(() => of({ commandes: [], total: 0 }))),

         enAttente: this.http.get<any>(
            `${this.API}/commande/boutique/${bq}?limit=1&statut=en_attente`, h
         ).pipe(catchError(() => of({ total: 0 }))),

         produits: this.http.get<any>(
            `${this.API}/produits?boutiqueId=${bq}&limit=20`, h
         ).pipe(catchError(() => of({ data: [], total: 0 }))),
      })
         .pipe(takeUntil(this.destroy$))
         .subscribe({
            next: (res: any) => {
               this.commandesRecentes = res.commandes?.commandes ?? [];
               this.kpi.commandesEnCours = res.commandes?.total ?? 0;
               this.kpi.commandesEnAttente = res.enAttente?.total ?? 0;

               const produits: any[] = res.produits?.data ?? res.produits ?? [];
               this.kpi.totalProduits = res.produits?.total ?? produits.length;

               this.kpi.stockTotal = produits.reduce((acc: number, p: any) =>
                  acc + (p.variantes ?? []).reduce((s: number, v: any) => s + (v.stock ?? 0), 0), 0
               );

               this.produitsRupture = produits
                  .filter((p: any) =>
                     (p.variantes ?? []).length > 0 &&
                     (p.variantes ?? []).every((v: any) => (v.stock ?? 0) === 0)
                  )
                  .map((p: any) => ({
                     _id: p._id, nom: p.nom, categories: p.categories ?? []
                  }));

               this.kpi.produitsRupture = this.produitsRupture.length;

               this.topProduits = produits.slice(0, 5).map((p: any) => ({
                  _id: p._id,
                  nom: p.nom,
                  stock: (p.variantes ?? []).reduce((s: number, v: any) => s + (v.stock ?? 0), 0)
               }));

               this.buildChartData();
               this.isLoading = false;
            },
            error: () => { this.isLoading = false; }
         });
   }

   private buildChartData(): void {
      const pts: VentesPoint[] = [];
      let base = 150000;
      for (let i = 29; i >= 0; i--) {
         const d = new Date();
         d.setDate(d.getDate() - i);
         base = Math.max(30000, base + (Math.random() - 0.45) * 60000);
         pts.push({
            date: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            montant: Math.round(base)
         });
      }
      this.ventesData = pts;
      this.buildSvgPath();
   }

   private buildSvgPath(): void {
      if (!this.ventesData.length) return;
      const W = this.chartWidth, H = this.chartHeight;
      const max = Math.max(...this.ventesData.map(p => p.montant)) * 1.1;
      const pad = 10;

      const points = this.ventesData.map((p, i) => ({
         x: pad + (i / (this.ventesData.length - 1)) * (W - pad * 2),
         y: H - pad - ((p.montant / max) * (H - pad * 2)),
         date: p.date,
         montant: p.montant
      }));

      this.chartPoints = points;

      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
         const prev = points[i - 1], curr = points[i];
         const cpx = (prev.x + curr.x) / 2;
         path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
      }

      this.chartPath = path;
      const last = points[points.length - 1];
      this.chartFill = `${path} L ${last.x} ${H} L ${points[0].x} ${H} Z`;
   }

   getClientName(c: CommandeRecente): string {
      if (!c.acheteur) return '—';
      return [c.acheteur.prenom, c.acheteur.nom].filter(Boolean).join(' ');
   }

   navigateTo(path: string): void { this.router.navigate([path]); }

   get greeting(): string {
      const h = new Date().getHours();
      if (h < 12) return 'Bonjour';
      if (h < 18) return 'Bon après-midi';
      return 'Bonsoir';
   }
}