import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  emailError = '';
  passwordError = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  validateForm(): boolean {
    this.emailError = '';
    this.passwordError = '';
    let valid = true;

    if (!this.email) {
      this.emailError = 'Email requis';
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(this.email)) {
      this.emailError = 'Email invalide';
      valid = false;
    }

    if (!this.password) {
      this.passwordError = 'Mot de passe requis';
      valid = false;
    }

    return valid;
  }


  login() {
    this.error = '';
    this.loading = true;

    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: res => {
        this.authService.setSession(res.token, res.user);
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.error = err.error.message || 'Erreur de connexion';
        this.loading = false;
      }
    });
  }

}
