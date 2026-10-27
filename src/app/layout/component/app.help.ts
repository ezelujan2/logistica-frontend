import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ManualService, ManualSection } from '../../service/manual.service';
import { AuthService } from '../../service/auth.service';
import { ManualSectionView } from '../../pages/novedades/manual-section';

// Botón "?" de la barra superior: abre al costado la parte del manual que
// explica la pantalla en la que está el usuario, con un buscador para el resto
// del manual. Lo ven todos los roles.
@Component({
    selector: 'app-help',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, DrawerModule, ButtonModule, InputTextModule, TooltipModule, ManualSectionView],
    template: `
        <button type="button" class="layout-topbar-action" (click)="open()" pTooltip="Ayuda de esta pantalla" tooltipPosition="bottom">
            <i class="pi pi-question-circle"></i>
        </button>

        <p-drawer [(visible)]="visible" position="right" [style]="{ width: '42rem', 'max-width': '100vw' }" header="Ayuda">
            <div class="flex flex-col gap-4">
                <input pInputText type="text" class="w-full" placeholder="Buscar en todo el manual…" [(ngModel)]="query" />

                <div *ngIf="loading" class="text-muted-color">Cargando…</div>
                <div *ngIf="error" class="text-muted-color">No se pudo cargar la ayuda. Probá de nuevo en un rato.</div>

                <ng-container *ngIf="!loading && !error">
                    <div *ngIf="query.trim()" class="text-xs text-muted-color">{{ shown().length }} secciones del manual mencionan "{{ query }}"</div>
                    <div *ngIf="!shown().length" class="text-muted-color">No encontré nada sobre eso en el manual.</div>
                    <app-manual-section *ngFor="let s of shown()" [section]="s" [query]="query" />
                </ng-container>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex flex-wrap gap-2">
                    <p-button *ngIf="authService.hasPermission('useAssistant')" label="Preguntale al asistente" icon="pi pi-comments" [text]="true" routerLink="/app/assistant" (click)="visible = false" />
                    <p-button *ngIf="authService.hasPermission('viewReleaseNotes')" label="Manual completo" icon="pi pi-book" [text]="true" routerLink="/app/novedades" [queryParams]="{ tab: 'manual' }" (click)="visible = false" />
                </div>
            </ng-template>
        </p-drawer>
    `
})
export class AppHelp {
    visible = false;
    loading = false;
    error = false;
    query = '';
    private forScreen: ManualSection[] = [];
    private all: ManualSection[] = [];

    constructor(
        private manual: ManualService,
        private router: Router,
        public authService: AuthService
    ) {}

    async open() {
        this.visible = true;
        this.query = '';
        this.loading = true;
        this.error = false;
        try {
            [this.all, this.forScreen] = await Promise.all([this.manual.getSections(), this.manual.sectionsFor(this.router.url)]);
        } catch {
            this.error = true;
        } finally {
            this.loading = false;
        }
    }

    shown(): ManualSection[] {
        return this.query.trim() ? this.manual.search(this.all, this.query) : this.forScreen;
    }
}
