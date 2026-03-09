import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Subscription } from 'rxjs';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-reauth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule, PasswordModule],
  template: `
    <p-dialog header="Sesión expirada" [(visible)]="displayModal" [modal]="true" [closable]="false" [style]="{width: '400px'}">
        <p class="mb-4">Tu sesión ha expirado por inactividad. Por favor, ingresa tu contraseña para continuar donde lo dejaste.</p>

        <div class="mb-4">
            <label for="email" class="block text-900 font-medium mb-2">Correo electrónico</label>
            <input id="email" type="text" pInputText [value]="email" disabled class="w-full p-disabled" />
        </div>

        <div class="mb-4">
            <label for="password" class="block text-900 font-medium mb-2">Contraseña</label>
            <p-password id="password" [(ngModel)]="password" [feedback]="false" [toggleMask]="true" styleClass="w-full" [fluid]="true" (keyup.enter)="onConfirm()"></p-password>
            <small *ngIf="errorMessage" class="p-error block mt-2 text-red-500">{{ errorMessage }}</small>
        </div>

        <ng-template pTemplate="footer">
            <button pButton pRipple icon="pi pi-times" class="p-button-text p-button-secondary" label="Cancelar" (click)="onCancel()" [disabled]="loading"></button>
            <button pButton pRipple icon="pi pi-check" label="Iniciar Sesión" (click)="onConfirm()" [loading]="loading" autofocus></button>
        </ng-template>
    </p-dialog>
  `
})
export class AppReauthModal implements OnInit, OnDestroy {
  displayModal = false;
  email = '';
  password = '';
  errorMessage = '';
  loading = false;
  private currentResolver: { resolve: (val: any) => void, reject: (err: any) => void } | null = null;
  private subscription?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.subscription = this.authService.showReAuth$.subscribe(resolver => {
      this.currentResolver = resolver;
      this.email = this.authService.getUserEmail() || '';
      this.password = '';
      this.errorMessage = '';
      this.displayModal = true;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onConfirm() {
    if (!this.password) {
      this.errorMessage = 'Por favor, ingresa tu contraseña.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.loading = false;
        this.displayModal = false;
        if (this.currentResolver) {
          this.currentResolver.resolve(response);
          this.currentResolver = null;
        }
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401) {
          this.errorMessage = 'Contraseña incorrecta.';
        } else {
          this.errorMessage = 'Ocurrió un error. Intenta nuevamente.';
        }
      }
    });
  }

  onCancel() {
    this.displayModal = false;
    if (this.currentResolver) {
      this.currentResolver.reject('cancelled');
      this.currentResolver = null;
    }
  }
}
