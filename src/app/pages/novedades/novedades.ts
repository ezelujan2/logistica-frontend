import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { RELEASES, CURRENT_RELEASE, ChangeKind, Release } from './changelog';
import { markReleaseSeen } from './release-notice';
import { ManualService, ManualSection, normalizeText as normalize } from '../../service/manual.service';

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

// Cuántas versiones se muestran antes de "Ver versiones anteriores".
const RELEASES_SHOWN = 10;

@Component({
    selector: 'app-novedades',
    standalone: true,
    imports: [CommonModule, FormsModule, TabsModule, TagModule, TooltipModule, InputTextModule, SelectButtonModule, SelectModule, ButtonModule],
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
                    <!-- Novedades: la versión actual abierta y las anteriores colapsadas,
                         con buscador y filtro por tipo para cuando haya muchas. -->
                    <p-tabpanel value="novedades">
                        <div class="flex flex-wrap gap-3 mb-4">
                            <input pInputText type="text" class="flex-1 min-w-56" placeholder="Buscar en las novedades… (ej. IVA, chofer, asistente)" [(ngModel)]="search" />
                            <p-selectbutton [options]="kindOptions" [(ngModel)]="kinds" [multiple]="true" optionLabel="label" optionValue="value" size="small" />
                        </div>

                        <div *ngIf="filtering() && !visibleReleases().length" class="text-muted-color">Ningún cambio coincide con la búsqueda.</div>
                        <div *ngIf="filtering() && visibleReleases().length" class="text-sm text-muted-color mb-3">{{ matchCount() }} cambios en {{ visibleReleases().length }} versiones</div>

                        <div *ngFor="let release of shownReleases()" class="border border-surface-200 dark:border-surface-700 rounded-lg mb-3">
                            <button type="button" class="w-full flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-left" (click)="toggle(release.version)">
                                <i class="pi text-muted-color" [ngClass]="isOpen(release.version) ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                                <span class="text-lg font-bold">{{ release.version }}</span>
                                <span class="text-sm text-muted-color">{{ formatDate(release.date) }}</span>
                                <p-tag *ngIf="release.version === current.version" value="Actual" severity="success" />
                                <span class="font-medium flex-1 min-w-48">{{ release.title }}</span>
                                <span class="flex flex-wrap gap-1">
                                    <p-tag *ngFor="let c of kindCounts(release)" [value]="c.count + ' ' + c.label" [severity]="c.severity" styleClass="text-xs" />
                                </span>
                            </button>
                            <ul *ngIf="isOpen(release.version)" class="flex flex-col gap-2 pl-0 list-none px-3 pb-3 m-0">
                                <li *ngFor="let change of filteredChanges(release)" class="flex items-start gap-3">
                                    <p-tag [value]="kindLabel(change.kind)" [severity]="kindSeverity(change.kind)" styleClass="shrink-0 w-28 justify-center" />
                                    <span class="leading-relaxed">{{ change.text }}</span>
                                </li>
                            </ul>
                        </div>

                        <p-button *ngIf="hiddenCount() > 0" [label]="'Ver ' + hiddenCount() + ' versiones anteriores'" icon="pi pi-angle-down" [text]="true" (click)="showAll = true" />
                    </p-tabpanel>

                    <!-- Manual: índice fijo al costado (desplegable en el celular) y un
                         buscador que deja sólo las secciones que mencionan lo buscado. -->
                    <p-tabpanel value="manual">
                        <div *ngIf="manualError" class="text-muted-color">No se pudo cargar el manual. Probá recargar la página.</div>
                        <div *ngIf="!sections.length && !manualError" class="text-muted-color">Cargando el manual…</div>

                        <div *ngIf="sections.length" class="grid grid-cols-12 gap-6">
                            <aside class="col-span-12 lg:col-span-3">
                                <div class="lg:sticky lg:top-24 flex flex-col gap-3">
                                    <input pInputText type="text" class="w-full" placeholder="Buscar en el manual…" [(ngModel)]="manualSearch" />
                                    <div *ngIf="manualSearch.trim()" class="text-xs text-muted-color">{{ visibleSections().length }} de {{ sections.length }} secciones</div>
                                    <p-select class="lg:hidden" [options]="visibleSections()" optionLabel="title" optionValue="id" placeholder="Ir a una sección…" (onChange)="goTo($event.value)" styleClass="w-full" appendTo="body" />
                                    <nav class="hidden lg:flex flex-col gap-0.5 max-h-[70vh] overflow-y-auto pr-1">
                                        <button *ngFor="let s of visibleSections()" type="button" class="text-left text-sm px-2 py-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800" (click)="goTo(s.id)">{{ s.title }}</button>
                                    </nav>
                                </div>
                            </aside>
                            <div class="col-span-12 lg:col-span-9">
                                <div *ngIf="!visibleSections().length" class="text-muted-color">Ninguna sección del manual menciona "{{ manualSearch }}".</div>
                                <section *ngFor="let s of visibleSections()" [id]="s.id" class="lecma-manual scroll-mt-24" [innerHTML]="s.html"></section>
                            </div>
                        </div>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </div>
    `,
})
export class Novedades implements OnInit {
    releases: Release[] = RELEASES;
    current = CURRENT_RELEASE;
    tab = 'novedades';
    serverVersion: string | null = null;

    // Novedades
    search = '';
    kinds: ChangeKind[] = [];
    kindOptions = KIND_ORDER.map((k) => ({ label: KIND_LABELS[k], value: k }));
    showAll = false;
    private open = new Set<string>([CURRENT_RELEASE.version]);

    // Manual
    sections: ManualSection[] = [];
    manualSearch = '';
    manualError = false;

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private manual: ManualService
    ) {}

    ngOnInit() {
        if (this.route.snapshot.queryParamMap.get('tab') === 'manual') this.tab = 'manual';
        markReleaseSeen();
        this.loadManual();
        this.loadServerVersion();
    }

    // --- Novedades ---

    filtering(): boolean {
        return this.search.trim().length > 0 || this.kinds.length > 0;
    }

    filteredChanges(release: Release) {
        const q = normalize(this.search.trim());
        return [...release.changes]
            .filter((c) => (!this.kinds.length || this.kinds.includes(c.kind)) && (!q || normalize(c.text).includes(q)))
            .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
    }

    visibleReleases(): Release[] {
        return this.filtering() ? this.releases.filter((r) => this.filteredChanges(r).length > 0) : this.releases;
    }

    shownReleases(): Release[] {
        const visible = this.visibleReleases();
        return this.filtering() || this.showAll ? visible : visible.slice(0, RELEASES_SHOWN);
    }

    hiddenCount(): number {
        return this.visibleReleases().length - this.shownReleases().length;
    }

    matchCount(): number {
        return this.visibleReleases().reduce((sum, r) => sum + this.filteredChanges(r).length, 0);
    }

    isOpen(version: string): boolean {
        // Al buscar o filtrar se abren todas, para ver qué coincidió.
        return this.filtering() || this.open.has(version);
    }

    toggle(version: string) {
        if (this.filtering()) return;
        if (this.open.has(version)) this.open.delete(version);
        else this.open.add(version);
    }

    kindCounts(release: Release) {
        const changes = this.filtering() ? this.filteredChanges(release) : release.changes;
        return KIND_ORDER.map((k) => ({ label: KIND_LABELS[k], severity: KIND_SEVERITY[k], count: changes.filter((c) => c.kind === k).length })).filter((c) => c.count > 0);
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

    // --- Manual ---

    private async loadManual() {
        try {
            this.sections = await this.manual.getSections();
        } catch {
            this.manualError = true;
        }
    }

    visibleSections(): ManualSection[] {
        return this.manual.search(this.sections, this.manualSearch);
    }

    goTo(id: string | null) {
        if (!id) return;
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    private async loadServerVersion() {
        try {
            const res = await firstValueFrom(this.http.get<{ version: string }>(`${environment.apiUrl}version`));
            this.serverVersion = res.version;
        } catch {
            // Si no responde, simplemente no se muestra.
        }
    }
}
