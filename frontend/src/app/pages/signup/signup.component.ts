import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html'
})
export class SignupComponent {
  email = '';
  password = '';
  nom = '';
  phone = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  signup() {
    if (!this.email || !this.password) {
      this.error = 'Email et mot de passe requis';
      return;
    }

    this.authService.signup({ email: this.email, password: this.password, nom: this.nom, phone: this.phone })
      .subscribe({
        next: (res: any) => {
          localStorage.setItem('token', res.token);
          this.router.navigate(['/dashboard']);
        },
        error: err => {
          this.error = err.error.message || 'Erreur inscription';
        }
      });
  }
}
