import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  motDePasse = '';
  error = '';
  emailError = '';
  mdpError = '';
  loading = false;
  success = false;
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) { }

  // ── Validation live (blur) ──
  onEmailBlur(): void {
    if (!this.email) {
      this.emailError = 'Email requis';
    } else if (!/^\S+@\S+\.\S+$/.test(this.email)) {
      this.emailError = 'Email invalide';
    } else {
      this.emailError = '';
    }
  }

  onMdpBlur(): void {
    if (!this.motDePasse) {
      this.mdpError = 'Mot de passe requis';
    } else if (this.motDePasse.length < 8) {
      this.mdpError = 'Le mot de passe doit contenir au moins 8 caractères';
    } else {
      this.mdpError = '';
    }
  }

  // ── Validation complète avant submit ──
  validateForm(): boolean {
    this.onEmailBlur();
    this.onMdpBlur();
    return !this.emailError && !this.mdpError;
  }

  // ── Submit ──
  login(): void {
    this.error = '';
    this.success = false;

    if (!this.validateForm()) return;

    this.loading = true;

    this.authService.login({
      email: this.email,
      motDePasse: this.motDePasse
    }).subscribe({
      next: res => {
        const role = res.user.role;
        this.authService.setSession(res.token, res.user);
        this.success = true;
        setTimeout(() => {
          if (role === 'client') this.router.navigate(['']);
          if (role === 'boutique') this.router.navigate(['/boutique']);
          if (role === 'admin') this.router.navigate(['/admin']);
        }, 600);
      },
      error: err => {
        this.error = err.error?.message || 'Erreur de connexion';
        this.loading = false;
      }
    });
  }
}