import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
}

interface HoraireRow {
  jour: string;
  heures: string;
  ferme?: boolean;
}

@Component({
  selector: 'app-contact',
  imports: [CommonModule,FormsModule,RouterModule,ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit, OnDestroy {
contactForm!: FormGroup;
  isLoading = false;
  showSuccess = false;
  toast = { visible: false, message: '', type: '' };
  private toastTimer: any;
  isOpenNow = false;

  horaires: HoraireRow[] = [
    { jour: 'Lundi',    heures: '09h00 – 20h00' },
    { jour: 'Mardi',    heures: '09h00 – 20h00' },
    { jour: 'Mercredi', heures: '09h00 – 20h00' },
    { jour: 'Jeudi',    heures: '09h00 – 20h00' },
    { jour: 'Vendredi', heures: '09h00 – 21h00' },
    { jour: 'Samedi',   heures: '09h00 – 21h00' },
    { jour: 'Dimanche', heures: '',             ferme: true },
  ];

  sujets = [
    { value: 'commande',     label: 'Problème avec une commande' },
    { value: 'boutique',     label: 'Question sur une boutique' },
    { value: 'produit',      label: 'Information sur un produit' },
    { value: 'livraison',    label: 'Livraison & retrait' },
    { value: 'compte',       label: 'Problème de compte' },
    { value: 'partenariat',  label: 'Devenir partenaire' },
    { value: 'autre',        label: 'Autre' },
  ];

  faqs: FaqItem[] = [
    {
      question: 'Comment fonctionne le Click & Collect ?',
      answer: 'Le Click & Collect vous permet de commander en ligne et de retirer vos articles directement en boutique au Galaxy Mall. Une fois votre commande validée, vous recevrez un SMS quand vos articles seront prêts. Présentez simplement votre numéro de commande à la boutique.',
      open: false
    },
    {
      question: 'La livraison à domicile est-elle disponible ?',
      answer: 'Oui, la livraison est disponible sur Antananarivo et ses environs. Les délais sont généralement de 2 à 5 jours ouvrables selon votre zone. Des frais de livraison de 15 000 Ar s\'appliquent. Le Click & Collect reste gratuit.',
      open: false
    },
    {
      question: 'Comment annuler ou modifier une commande ?',
      answer: 'Vous pouvez annuler une commande depuis votre espace "Mes commandes" tant que son statut est "En attente" ou "Payée". Pour une modification, annulez et recommandez. Si la commande est déjà en préparation, contactez directement la boutique.',
      open: false
    },
    {
      question: 'Quels modes de paiement sont acceptés ?',
      answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard), le Mobile Money (MVola, Orange Money, Airtel Money) et le paiement en espèces au moment du retrait en boutique.',
      open: false
    },
    {
      question: 'Comment devenir boutique partenaire ?',
      answer: 'Si vous êtes commerçant au Galaxy Mall, vous pouvez rejoindre CentreShop en nous contactant via ce formulaire ou par email. Notre équipe vous contactera pour créer votre espace boutique et vous former à l\'utilisation de la plateforme.',
      open: false
    },
    {
      question: 'Comment fonctionne le programme de fidélité ?',
      answer: 'Chaque achat vous rapporte des points fidélité : 1 point pour 1 000 Ar dépensés. À partir de 2 000 points vous atteignez le niveau Argent, à partir de 5 000 points le niveau Or. Ces points peuvent être utilisés pour obtenir des réductions ou des avantages exclusifs.',
      open: false
    },
    {
      question: 'Puis-je retourner un article acheté ?',
      answer: 'La politique de retour dépend de chaque boutique. En général, les articles peuvent être retournés dans les 7 jours suivant le retrait, en état neuf avec l\'emballage d\'origine. Contactez directement la boutique concernée pour initier un retour.',
      open: false
    },
    {
      question: 'Mes données personnelles sont-elles sécurisées ?',
      answer: 'Oui. Nous utilisons des protocoles de chiffrement standard (HTTPS, JWT) pour protéger vos données. Vos informations de paiement ne sont jamais stockées sur nos serveurs. Consultez notre politique de confidentialité pour plus de détails.',
      open: false
    },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.checkIsOpen();
  }

  ngOnDestroy(): void {
    clearTimeout(this.toastTimer);
  }

  buildForm(): void {
    this.contactForm = this.fb.group({
      nom:     ['', [Validators.required, Validators.minLength(2)]],
      prenom:  ['', [Validators.required, Validators.minLength(2)]],
      email:   ['', [Validators.required, Validators.email]],
      sujet:   ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  checkIsOpen(): void {
    const now = new Date();
    const day = now.getDay(); // 0=dim, 1=lun … 6=sam
    const hour = now.getHours() + now.getMinutes() / 60;
    if (day === 0) { this.isOpenNow = false; return; }
    const close = (day === 5 || day === 6) ? 21 : 20;
    this.isOpenNow = hour >= 9 && hour < close;
  }

  isInvalid(field: string): boolean {
    const ctrl = this.contactForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;

    // Simulate API call → replace with real HTTP call
    setTimeout(() => {
      this.isLoading = false;
      this.showSuccess = true;
      this.contactForm.reset();
      this.showToast('Message envoyé avec succès !', 'success');
      setTimeout(() => this.showSuccess = false, 5000);
      // this.contactService.send(this.contactForm.value).subscribe(...)
    }, 1600);
  }

  toggleFaq(item: FaqItem): void {
    const wasOpen = item.open;
    this.faqs.forEach(f => f.open = false);
    if (!wasOpen) item.open = true;
  }

  showToast(message: string, type: string): void {
    clearTimeout(this.toastTimer);
    this.toast = { visible: true, message, type };
    this.toastTimer = setTimeout(() => this.toast.visible = false, 2800);
  }

  openMaps(): void {
    window.open('https://maps.google.com/?q=Andraharo+Antananarivo', '_blank');
  }
}
