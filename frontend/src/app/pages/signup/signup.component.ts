import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
//  - Champs: email, telephone, motDePasse, role, nom, prenom, image
export class SignupComponent {
  email = '';
  motDePasse = '';
  nom = '';
  prenom = '';
  telephone = '';
  role = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  signup() {
    if (!this.email || !this.motDePasse) {
      this.error = 'Email et mot de passe requis';
      return;
    }

    this.authService.signup({  email:this.email, telephone:this.telephone, motDePasse:this.motDePasse, role:this.role, nom:this.nom, prenom:this.prenom })
      .subscribe({
        next: (res: any) => {
          localStorage.setItem('token', res.token);
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
          this.error = err.error.message || 'Erreur inscription';
        }
      });
  }
}
