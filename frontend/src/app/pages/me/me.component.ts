import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserProfile } from '../../models/account.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-me',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './me.component.html',
  styleUrl: './me.component.scss'
})
export class MeComponent implements OnInit {
  user!: UserProfile;
  fidelitePercent = 0;

  // Profile form
  profilForm!: FormGroup;
  profilSaving = false;
  profilSuccess = false;
  profilSuccessMsg = '';

  // Password form
  pwForm!: FormGroup;
  pwSaving = false;
  pwError = '';
  pwShowOld = false;
  pwShowNew = false;
  pwShowConfirm = false;
  pwStrengthScore = 0;
  pwStrengthLabels = ['', 'Très faible', 'Moyen', 'Bon', 'Très fort'];
  pwStrengthColors = ['', '#ef4444', '#f59e0b', '#10b981', '#059669'];

  // Photo
  photoPreviewUrl: string | null = null;

  // Toast
  toastMsg = '';
  toastType = '';
  toastVisible = false;
  private toastTimer: any;

  constructor(private fb: FormBuilder, private accountService: UserService) {
     // Initialisation immédiate pour éviter que *ngIf ou formGroup plante
    this.pwForm = this.fb.group({
      pwOld: [''],
      pwNew: [''],
      pwConfirm: ['']
    });
  }

  ngOnInit(): void {
    this.accountService.getUser().subscribe((user) => {
      this.user = user;
      this.fidelitePercent = this.accountService.fidelitePercent;
      this.photoPreviewUrl = user?.photoUrl ?? null;
      this.initProfilForm(user);
    });
  }

  // ─── PROFILE ───────────────────────────────────────────────────────────────

  private initProfilForm(user: UserProfile): void {
    this.profilForm = this.fb.group({
      nom: [user.nom, [Validators.required]],
      prenom: [user.prenom, [Validators.required]],
      email: [user.email, [Validators.required, Validators.email]],
      telephone: [user.telephone],
    });
  }

  get f() { return this.profilForm.controls; }

  saveProfile(): void {
    if (this.profilForm.invalid) {
      this.profilForm.markAllAsTouched();
      return;
    }
    this.profilSaving = true;
    this.profilSuccess = false;

    this.accountService.updateProfile(this.profilForm.value).subscribe({
      next: () => {
        this.profilSaving = false;
        this.profilSuccess = true;
        this.profilSuccessMsg = 'Profil mis à jour avec succès !';
        this.showToast('Profil sauvegardé !', 'success');
        setTimeout(() => (this.profilSuccess = false), 4000);
      },
      error: () => {
        this.profilSaving = false;
        this.showToast('Erreur lors de la sauvegarde.', 'error');
      },
    });
  }

  resetProfilForm(): void {
    this.initProfilForm(this.user);
    this.profilSuccess = false;
  }

  // ─── PHOTO ─────────────────────────────────────────────────────────────────

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.photoPreviewUrl = e.target?.result as string;
      this.showToast('Photo mise à jour', 'success');
    };
    reader.readAsDataURL(input.files[0]);
  }

  removePhoto(): void {
    this.photoPreviewUrl = null;
    this.showToast('Photo supprimée', '');
  }

  get avatarInitial(): string {
    return this.user?.prenom?.charAt(0).toUpperCase() ?? 'U';
  }

  // ─── PASSWORD ──────────────────────────────────────────────────────────────

  buildPwForm(): void {
    this.pwForm = this.fb.group(
      {
        pwOld: ['', Validators.required],
        pwNew: ['', [Validators.required, Validators.minLength(8)]],
        pwConfirm: ['', Validators.required],
      },
      { validators: this.pwMatchValidator }
    );
  }

  private pwMatchValidator(group: AbstractControl) {
    const n = group.get('pwNew')?.value;
    const c = group.get('pwConfirm')?.value;
    return n && c && n !== c ? { mismatch: true } : null;
  }

  get pw() { return this.pwForm?.controls; }

  checkPwStrength(value: string): void {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    this.pwStrengthScore = score;
  }

  get pwStrengthPercent(): number {
    return (this.pwStrengthScore / 4) * 100;
  }

  savePw(): void {
    if (!this.pwForm) return;
    this.pwError = '';

    if (this.pwForm.invalid) {
      this.pwForm.markAllAsTouched();
      if (this.pwForm.hasError('mismatch')) {
        this.pwError = 'Les mots de passe ne correspondent pas.';
      }
      return;
    }

    this.pwSaving = true;
    this.accountService
      .changePassword(this.pw['pwOld'].value, this.pw['pwNew'].value)
      .subscribe({
        next: () => {
          this.pwSaving = false;
          this.pwForm.reset();
          this.pwStrengthScore = 0;
          this.showToast('Mot de passe modifié avec succès !', 'success');
        },
        error: () => {
          this.pwSaving = false;
          this.pwError = 'Mot de passe actuel incorrect.';
        },
      });
  }

  resetPwForm(): void {
    this.pwForm?.reset();
    this.pwStrengthScore = 0;
    this.pwError = '';
  }

  // ─── DANGER ────────────────────────────────────────────────────────────────

  confirmDelete(): void {
    if (confirm('Êtes-vous absolument sûr ? Cette action est irréversible et supprimera tout votre compte.')) {
      this.accountService.deleteAccount().subscribe(() => {
        this.showToast('Compte supprimé (démo)', '');
      });
    }
  }

  // ─── TOAST ─────────────────────────────────────────────────────────────────

  showToast(msg: string, type: 'success' | 'error' | ''): void {
    this.toastMsg = msg;
    this.toastType = type;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastVisible = false), 2800);
  }
}