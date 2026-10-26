import { Component, OnInit, SecurityContext, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { marked } from 'marked';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { environment } from '../../../environments/environment';
import { RELEASES, CURRENT_RELEASE, ChangeKind, Release } from './changelog';
import { markReleaseSeen } from './release-notice';

const KIND_LABELS: Record<ChangeKind, string> = {
    importante: 'Importante',
    nuevo: 'Nuevo',
    mejora: 'Mejora',
    correccion: 'Corrección',
    seguridad: 'Seguridad'
};

const KIND_SEVERITY: Record<ChangeKind, 'warn' | 'success' | 'info' | 'secondary' | 'danger'> = {
    importante: 'warn',
    nuevo: 'success',
    mejora: 'info',
    correccion: 'secondary',
    seguridad: 'danger'
};

// En qué orden se muestran los cambios de cada versión.
const KIND_ORDER: ChangeKind[] = ['importante', 'nuevo', 'mejora', 'correccion', 'seguridad'];

@Component({
    selector: 'app-novedades',
    standalone: true,
    imports: [CommonModule, TabsModule, TagModule, TooltipModule],
    // Sin encapsulación para poder dar estilo al HTML del manual, que viene de
    // un markdown; todo queda acotado a .lecma-manual.
    encapsulation: ViewEncapsulation.None,
    template: `
        <div class="card">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div class="font-semibold text-xl">Novedades y ayuda</div>
                <div class="flex items-center gap-2 text-sm">
                    <p-tag [value]="'Versión ' + current.version" severity="info" />
                    <p-tag *ngIf="serverVersion && serverVersion !== current.version" [value]="'Servidor ' + serverVersion" severity="danger" pTooltip="La versión del servidor no coincide con la de las pantallas" />
                </div>
            </div>

            <p-tabs [value]="tab">
                <p-tablist>
                    <p-tab value="novedades"><i class="pi pi-megaphone mr-2"></i>Novedades</p-tab>
                    <p-tab value="manual"><i class="pi pi-book mr-2"></i>Manual de usuario</p-tab>
                </p-tablist>
                <p-tabpanels>
                    <p-tabpanel value="novedades">
                        <div *ngFor="let release of releases; let first = first" class="mb-8">
                            <div class="flex flex-wrap items-baseline gap-3 mb-1">
                                <span class="text-2xl font-bold">{{ release.version }}</span>
                                <span class="text-muted-color">{{ formatDate(release.date) }}</span>
                                <p-tag *ngIf="first" value="Actual" severity="success" />
                            </div>
                            <div class="font-semibold mb-3">{{ release.title }}</div>
                            <ul class="flex flex-col gap-2 pl-0 list-none">
                                <li *ngFor="let change of sorted(release)" class="flex items-start gap-3">
                                    <p-tag [value]="kindLabel(change.kind)" [severity]="kindSeverity(change.kind)" styleClass="shrink-0 w-28 justify-center" />
                                    <span class="leading-relaxed">{{ change.text }}</span>
                                </li>
                            </ul>
                        </div>
                    </p-tabpanel>
                    <p-tabpanel value="manual">
                        <div *ngIf="manualError" class="text-muted-color">No se pudo cargar el manual. Probá recargar la página.</div>
                        <div *ngIf="!manualHtml && !manualError" class="text-muted-color">Cargando el manual…</div>
                        <div *ngIf="manualHtml" class="lecma-manual" [innerHTML]="manualHtml"></div>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </div>
    `,
    styles: [
        `
            .lecma-manual { max-width: 56rem; line-height: 1.6; }
            .lecma-manual h2 { font-size: 1.4rem; font-weight: 700; margin: 2rem 0 0.75rem; padding-top: 1rem; border-top: 1px solid var(--surface-border); }
            .lecma-manual h2:first-child { border-top: none; margin-top: 0; padding-top: 0; }
            .lecma-manual h3 { font-size: 1.1rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
            .lecma-manual p { margin: 0 0 0.75rem; }
            .lecma-manual ul, .lecma-manual ol { margin: 0 0 0.75rem; padding-left: 1.5rem; }
            .lecma-manual ul { list-style: disc; }
            .lecma-manual ol { list-style: decimal; }
            .lecma-manual li { margin-bottom: 0.25rem; }
            .lecma-manual table { width: 100%; border-collapse: collapse; margin: 0 0 1rem; font-size: 0.925rem; }
            .lecma-manual th, .lecma-manual td { border: 1px solid var(--surface-border); padding: 0.4rem 0.6rem; text-align: left; vertical-align: top; }
            .lecma-manual th { background: var(--surface-ground); font-weight: 600; }
            .lecma-manual blockquote { margin: 0 0 1rem; padding: 0.5rem 1rem; border-left: 4px solid var(--primary-color); background: var(--surface-ground); }
            .lecma-manual code { font-size: 0.875em; }
        `
    ]
})
export class Novedades implements OnInit {
    releases: Release[] = RELEASES;
    current = CURRENT_RELEASE;
    tab = 'novedades';
    manualHtml: SafeHtml | null = null;
    manualError = false;
    serverVersion: string | null = null;

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit() {
        if (this.route.snapshot.queryParamMap.get('tab') === 'manual') this.tab = 'manual';
        markReleaseSeen();
        this.loadManual();
        this.loadServerVersion();
    }

    private async loadManual() {
        try {
            // El manual viaja con cada versión de las pantallas, así que siempre
            // describe lo que está instalado.
            const markdown = await firstValueFrom(this.http.get('/manual-usuario.md', { responseType: 'text' }));
            const html = marked.parse(markdown, { async: false }) as string;
            const safe = this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
            this.manualHtml = this.sanitizer.bypassSecurityTrustHtml(safe);
        } catch {
            this.manualError = true;
        }
    }

    private async loadServerVersion() {
        try {
            const res = await firstValueFrom(this.http.get<{ version: string }>(`${environment.apiUrl}version`));
            this.serverVersion = res.version;
        } catch {
            // Si no responde, simplemente no se muestra.
        }
    }

    sorted(release: Release) {
        return [...release.changes].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
    }

    kindLabel(kind: ChangeKind) {
        return KIND_LABELS[kind];
    }

    kindSeverity(kind: ChangeKind) {
        return KIND_SEVERITY[kind];
    }

    formatDate(date: string) {
        const [y, m, d] = date.split('-').map(Number);
        return new Date(y!, m! - 1, d!).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
}
