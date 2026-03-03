// form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { BoutiqueService } from '../../../../services/boutique.service';
import { AuthService } from '../../../../services/auth.service';
<<<<<<< Updated upstream
import { environment } from '../../../../../environments/environment';
=======
>>>>>>> Stashed changes

@Component({
   selector: 'app-manager-produit-form',
   standalone: true,
   imports: [CommonModule, RouterModule, ReactiveFormsModule],
   templateUrl: './form.component.html',
   styleUrl: './form.component.scss'
})
export class ManagerProduitFormComponent implements OnInit {

<<<<<<< Updated upstream
   private readonly API = `${environment.apiUrl}produits`;
=======
   private readonly API = 'http://localhost:3000/produits';
>>>>>>> Stashed changes

   form!: FormGroup;
   isLoading = false;
   isSaving = false;
   errorMessage = '';
   isEditMode = false;
   produitId = '';

   boutiqueId = '';
   boutiqueName = '';

   imagePreviews: (string | null)[] = [null, null, null, null, null];
   imageFiles: (File | null)[] = [null, null, null, null, null];
   existingImages: string[] = [];

   get imageCount(): number {
      return this.imagePreviews.filter(p => p !== null).length + this.existingImages.length;
   }

   constructor(
      private fb: FormBuilder,
      private http: HttpClient,
      private router: Router,
      private route: ActivatedRoute,
      private boutiqueService: BoutiqueService,
      private authService: AuthService
   ) { }

   ngOnInit(): void {
      this.buildForm();
      this.initBoutique();
      const id = this.route.snapshot.paramMap.get('id');
      if (id) { this.isEditMode = true; this.produitId = id; this.loadProduit(id); }
   }

   // ── Boutique ──────────────────────────────────────────────────────────────
   private initBoutique(): void {
      const user = this.authService.getCurrentUser();
      const userId = user?._id || user?.id || '';
      this.boutiqueName = user?.prenom || user?.nom || 'Ma Boutique';

      if (userId) {
         this.boutiqueService.getBoutiquesByUser(userId).subscribe({
            next: (boutiques: any[]) => {
               if (boutiques.length > 0) {
                  this.boutiqueId = boutiques[0]._id;
                  this.boutiqueName = boutiques[0].nom;
               }
            },
            error: () => { }
         });
      }
   }

   // ── Formulaire ────────────────────────────────────────────────────────────
   private buildForm(): void {
      this.form = this.fb.group({
         nom: ['', [Validators.required, Validators.minLength(2)]],
         description: [''],
         prix: [null, [Validators.required, Validators.min(0)]],
         actif: [true],
         categories: this.fb.array([this.fb.group({ nom: [''] })]),
         variantes: this.fb.array([])
      });
   }

   // ── Chargement edition ────────────────────────────────────────────────────
   private loadProduit(id: string): void {
      this.isLoading = true;
      this.http.get<any>(`${this.API}/${id}`).subscribe({
         next: (res) => {
            const p = res.data ?? res;
            if (!p) { this.errorMessage = 'Produit introuvable.'; this.isLoading = false; return; }

            this.form.patchValue({
               nom: p.nom ?? '',
               description: p.description ?? '',
               prix: p.prix ?? null,
               actif: p.actif ?? true,
            });

            const catArray = this.categoriesArray;
            catArray.clear();
            (p.categories?.length ? p.categories : [{ nom: '' }])
               .forEach((c: any) => catArray.push(this.fb.group({ nom: [c.nom ?? ''] })));

            const varArray = this.variantes;
            varArray.clear();
            (p.variantes ?? []).forEach((v: any) => varArray.push(this.fb.group({
               type: [v.type ?? 'Taille'],
               valeur: [v.valeur ?? '', Validators.required],
               prix: [v.prix ?? null, [Validators.required, Validators.min(0)]],
               stock: [v.stock ?? 0, [Validators.required, Validators.min(0)]]
            })));

            this.existingImages = p.images ?? [];
            this.isLoading = false;
         },
         error: () => { this.errorMessage = 'Impossible de charger le produit.'; this.isLoading = false; }
      });
   }

   // ── Getters ───────────────────────────────────────────────────────────────
   get variantes(): FormArray { return this.form.get('variantes') as FormArray; }
   get categoriesArray(): FormArray { return this.form.get('categories') as FormArray; }

   // ── Variantes ─────────────────────────────────────────────────────────────
   addVariante(): void {
      this.variantes.push(this.fb.group({
         type: ['Taille'],
         valeur: ['', Validators.required],
         prix: [null, [Validators.required, Validators.min(0)]],
         stock: [0, [Validators.required, Validators.min(0)]]
      }));
   }
   removeVariante(i: number): void { this.variantes.removeAt(i); }

   // ── Categories ────────────────────────────────────────────────────────────
   addCategorie(): void { this.categoriesArray.push(this.fb.group({ nom: [''] })); }
   removeCategorie(i: number): void { if (this.categoriesArray.length > 1) this.categoriesArray.removeAt(i); }

   // ── Images ────────────────────────────────────────────────────────────────
   onImageChange(event: Event, index: number): void {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      this.imageFiles[index] = file;
      const reader = new FileReader();
      reader.onload = (e) => { this.imagePreviews[index] = e.target?.result as string; };
      reader.readAsDataURL(file);
   }
   removeImage(i: number): void { this.imageFiles[i] = null; this.imagePreviews[i] = null; }
   removeExistingImage(i: number): void { this.existingImages.splice(i, 1); }

   // ── Soumission JSON ───────────────────────────────────────────────────────
   submit(): void {
      if (this.form.invalid) {
         this.form.markAllAsTouched();
         this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
         return;
      }
      if (!this.boutiqueId) {
         this.errorMessage = 'Boutique non trouvée. Veuillez vous reconnecter.';
         return;
      }

      this.isSaving = true;
      this.errorMessage = '';

      const v = this.form.value;
      const body = {
         nom: v.nom,
         description: v.description || '',
         prix: Number(v.prix),
         actif: v.actif,
         boutique: this.boutiqueId,
         categories: v.categories.filter((c: any) => c.nom?.trim()),
         variantes: v.variantes
      };

      console.log('Body envoyé:', JSON.stringify(body));

      const req$ = this.isEditMode
         ? this.http.put<any>(`${this.API}/${this.produitId}`, body)
         : this.http.post<any>(this.API, body);

      req$.subscribe({
         next: () => { this.isSaving = false; this.router.navigate(['/boutique/produits']); },
         error: (err: any) => {
            this.isSaving = false;
            this.errorMessage = err.error?.message || 'Erreur lors de l\'enregistrement.';
         }
      });
   }

   cancel(): void { this.router.navigate(['/boutique/produits']); }
}