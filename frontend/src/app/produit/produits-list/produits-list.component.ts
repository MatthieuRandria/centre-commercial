import { Component, OnInit } from '@angular/core';
import { Produit } from '../../shared/produit.model';
import { ProduitsService } from '../../services/produits.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-produits-list',
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './produits-list.component.html',
  styleUrl: './produits-list.component.scss'
})
export class ProduitsListComponent implements OnInit{
  produits: Produit[]=[];
  total = 0;
  page = 1;
  limit = 8;
  pages = 0;

  filters: any = {
    page: 1,
    limit: 8,
    prixMin: null,
    prixMax: null,
    sortBy: 'date',
    order: 'desc'
  };

  loading = false;

  constructor(private produitService: ProduitsService){}
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  loadProduits(): void {
    this.loading = true;

    this.produitService.getProduits(this.filters).subscribe({
      next: (res) => {
        this.produits = res.data;
        this.total = res.total;
        this.pages = res.pages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadProduits();
  }

  changePage(page: number): void {
    this.filters.page = page;
    this.loadProduits();
  }

}
