import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})

export class DashboardComponent implements OnInit {
  message='';
  user: any;

  constructor(private authService: AuthService,private userService: UserService) {
    this.user = this.authService.getCurrentUser();
  }

  ngOnInit() {
    this.userService.getDashboard().subscribe({
      next: (res: any) => this.message = res.message,
      error: err => this.message = 'Erreur : accès refusé'
    });
  }

}
