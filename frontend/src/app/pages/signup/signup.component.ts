import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {

  // Champs — structure originale inchangée
  email = '';
  motDePasse = '';
  nom = '';
  prenom = '';
  telephone = '';
  role = 'client';
  error = '';

  // Champs supplémentaires
  confirm = '';
  cguAccepted = false;

  // États UI
  loading = false;
  success = false;
  showPassword = false;
  showConfirm = false;
  telFocused = false;

  // Erreurs champs
  nomError = '';
  prenomError = '';
  emailError = '';
  telephoneError = '';
  mdpError = '';
  confirmError = '';
  cguError = '';

  // Force mot de passe
  strengthScore = 0;

  get strengthLabel(): string {
    return ['', 'Trop faible', 'Faible', 'Moyen', 'Fort'][this.strengthScore] ?? '';
  }
  get strengthClass(): string {
    return ['', 'weak', 'weak', 'medium', 'strong'][this.strengthScore] ?? '';
  }
  strengthColor(seg: number): string {
    const colors: Record<number, string> = { 1: '#dc2626', 2: '#f59e0b', 3: '#f59e0b', 4: '#10b981' };
    return seg <= this.strengthScore ? (colors[this.strengthScore] ?? 'var(--border)') : 'var(--border)';
  }

  constructor(private authService: AuthService, private router: Router) { }

  onPasswordInput(): void {
    const v = this.motDePasse;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    this.strengthScore = score;
  }

  onBlur(field: string): void {
    switch (field) {
      case 'nom':
        this.nomError = this.nom.trim() ? '' : 'Le nom est requis.';
        break;
      case 'prenom':
        this.prenomError = this.prenom.trim() ? '' : 'Le prénom est requis.';
        break;
      case 'email':
        if (!this.email.trim()) this.emailError = 'Email requis.';
        else if (!/^\S+@\S+\.\S+$/.test(this.email)) this.emailError = 'Adresse email invalide.';
        else this.emailError = '';
        break;
      case 'telephone':
        this.telephoneError = this.telephone.replace(/\s/g, '').length >= 8
          ? '' : 'Numéro de téléphone invalide.';
        break;
      case 'motDePasse':
        this.mdpError = this.motDePasse.length >= 8
          ? '' : 'Le mot de passe doit contenir au moins 8 caractères.';
        break;
      case 'confirm':
        this.confirmError = this.confirm === this.motDePasse
          ? '' : 'Les mots de passe ne correspondent pas.';
        break;
    }
  }

  private validateForm(): boolean {
    this.onBlur('nom');
    this.onBlur('prenom');
    this.onBlur('email');
    this.onBlur('telephone');
    this.onBlur('motDePasse');
    this.onBlur('confirm');
    if (!this.cguAccepted) this.cguError = 'Vous devez accepter les CGU pour continuer.';
    else this.cguError = '';

    return !this.nomError && !this.prenomError && !this.emailError
      && !this.telephoneError && !this.mdpError && !this.confirmError
      && !this.cguError;
  }

  // Méthode originale — signature inchangée
  signup() {
    this.error = '';
    this.success = false;

    if (!this.email || !this.motDePasse) {
      this.error = 'Email et mot de passe requis';
      return;
    }

    if (!this.validateForm()) return;

    this.loading = true;

    this.authService.signup({
      email: this.email,
      telephone: this.telephone,
      motDePasse: this.motDePasse,
      role: this.role,
      nom: this.nom,
      prenom: this.prenom
    }).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        const role = res.user.role;
        this.authService.setSession(res.token, res.user);
        this.success = true;
        setTimeout(() => {
          if (role === 'client') this.router.navigate(['']);
          if (role === 'boutique') this.router.navigate(['/boutique']);
          if (role === 'admin') this.router.navigate(['/admin']);
        }, 800);
      },
      error: err => {
        this.error = err.error.message || 'Erreur inscription';
        this.loading = false;
      }
    });
  }
}