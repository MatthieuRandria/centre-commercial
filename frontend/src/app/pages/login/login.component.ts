import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(private authService: AuthService, private router: Router) {}

  validateForm(): boolean {
    this.emailError = '';
    this.mdpError = '';
    let valid = true;

    if (!this.email) {
      this.emailError = 'Email requis';
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(this.email)) {
      this.emailError = 'Email invalide';
      valid = false;
    }

    if (!this.motDePasse) {
      this.mdpError = 'Mot de passe requis';
      valid = false;
    }

    return valid;
  }


  login() {
    this.error = '';
    this.loading = true;

    this.authService.login({
      email: this.email,
      motDePasse: this.motDePasse
    }).subscribe({
      next: res => {
        const role=res.user.role;
        this.authService.setSession(res.token, res.user);
        if(role==="client"){
          this.router.navigate(['']);
        }
        if (role==="boutique") {
          this.router.navigate(['/boutique']);
        }if (role==="admin"){
          this.router.navigate(['/admin']);
        }
      },
      error: err => {
        this.error = err.error.message || 'Erreur de connexion';
        this.loading = false;
      }
    });
  }

}
