import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommandeClient, CommandesService } from '../../services/commandes.services';

@Component({
  selector: 'app-commande-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './confirmation-commande.component.html',
  styleUrl: './confirmation-commande.component.scss'
})
export class CommandeConfirmationComponent implements OnInit {
  commande: CommandeClient | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private commandesService: CommandesService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    this.commandesService.getMesCommandes({ limit: 100 }).subscribe({
      next: ({ commandes }) => {
        this.commande = commandes.find(c => c._id === id) ?? null;
        if (!this.commande) this.error = 'Commande introuvable.';
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger la commande.';
        this.loading = false;
      }
    });
  }

  get isClickCollect(): boolean {
    return this.commande?.modeRetrait === 'retrait_boutique';
  }

  get statutLabel(): string {
    const labels: Record<CommandeClient['statut'], string> = {
      en_attente: 'En attente',
      validee:    'Validée',
      preparee:   'Préparée',
      expediee:   'Expédiée',
      livree:     'Livrée',
      annulee:    'Annulée'
    };
    return this.commande ? labels[this.commande.statut] : '';
  }

  boutiqueNom(article: CommandeClient['articles'][0]): string {
    return typeof article.boutique === 'string'
      ? article.boutique
      : article.boutique.nom;
  }
}