import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { RELEASES, CURRENT_RELEASE, ChangeKind, Release } from './changelog';
import { markReleaseSeen } from './release-notice';
import { ManualService, ManualSection, normalizeText as normalize } from '../../service/manual.service';
import { ManualSectionView } from './manual-section';

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

/**
 * Las versiones que comparten los dos primeros números (2.4.0, 2.4.1, 2.4.2)
 * se muestran juntas en una tarjeta con el número de la última y el título de
 * la principal (la primera que salió). Adentro, de la más nueva a la más vieja.
 */
interface ReleaseGroup {
    key: string;
    main: Release;
    /** Actualizaciones posteriores a la principal, la más nueva primero. */
    updates: Release[];
    /** Fecha de la última del grupo. */
    date: string;
    versions: string[];
}

function groupReleases(releases: Release[]): ReleaseGroup[] {
    const groups = new Map<string, Release[]>();
    for (const r of releases) {
        const key = r.version.split('.').slice(0, 2).join('.');
        groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    // RELEASES viene de la más nueva a la más vieja: la principal es la última del grupo.
    return [...groups.entries()].map(([key, list]) => ({
        key,
        main: list[list.length - 1]!,
        updates: list.slice(0, -1),
        date: list[0]!.date,
        versions: list.map((r) => r.version)
    }));
}

@Component({
    selector: 'app-novedades',
    standalone: true,
    imports: [CommonModule, FormsModule, TabsModule, TagModule, TooltipModule, InputTextModule, SelectButtonModule, ButtonModule, ManualSectionView],
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

                        <div *ngIf="filtering() && !visibleGroups().length" class="text-muted-color">Ningún cambio coincide con la búsqueda.</div>
                        <div *ngIf="filtering() && visibleGroups().length" class="text-sm text-muted-color mb-3">{{ matchCount() }} cambios en {{ visibleGroups().length }} versiones</div>

                        <div *ngFor="let group of shownGroups()" class="border border-surface-200 dark:border-surface-700 rounded-lg mb-3 overflow-hidden">
                            <button
                                type="button"
                                class="w-full flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                                [attr.aria-expanded]="isOpen(group.key)"
                                (click)="toggle(group.key)"
                            >
                                <i class="pi text-muted-color" [ngClass]="isOpen(group.key) ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                                <span class="text-lg font-bold">{{ group.versions[0] }}</span>
                                <span class="text-sm text-muted-color">{{ formatDate(group.date) }}</span>
                                <p-tag *ngIf="group.versions.includes(current.version)" value="Actual" severity="success" />
                                <span class="font-medium flex-1 min-w-48">{{ group.main.title }}</span>
                                <span class="flex flex-wrap gap-1">
                                    <p-tag *ngFor="let c of kindCounts(group)" [value]="c.count + ' ' + c.label" [severity]="c.severity" styleClass="text-xs" />
                                </span>
                            </button>
                            <!-- Contenido separado del título por una línea; en pantallas anchas
                                 queda alineado con el título (después de la flecha). Si hay
                                 actualizaciones chicas, cada versión va con su número, la más
                                 nueva arriba. -->
                            <div *ngIf="isOpen(group.key)" class="px-4 pt-4 pb-5 sm:pl-11 flex flex-col gap-5 border-t border-surface-200 dark:border-surface-700">
                                <section *ngFor="let release of groupReleasesShown(group)" class="flex flex-col gap-4">
                                    <div *ngIf="group.updates.length" class="flex flex-wrap items-baseline gap-x-2 text-sm">
                                        <span class="font-semibold">{{ release.version }}</span>
                                        <span class="text-muted-color">· {{ formatDate(release.date) }}</span>
                                        <span *ngIf="release !== group.main" class="text-muted-color">· {{ release.title }}</span>
                                    </div>
                                    <ul class="list-none m-0 p-0 flex flex-col gap-4">
                                        <li *ngFor="let change of filteredChanges(release)" class="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4">
                                            <p-tag [value]="kindLabel(change.kind)" [severity]="kindSeverity(change.kind)" styleClass="shrink-0 self-start sm:w-28 justify-center" />
                                            <span class="leading-relaxed sm:pt-0.5">{{ change.text }}</span>
                                        </li>
                                    </ul>
                                </section>
                            </div>
                        </div>

                        <p-button *ngIf="hiddenCount() > 0" [label]="'Ver ' + hiddenCount() + ' versiones anteriores'" icon="pi pi-angle-down" [text]="true" (click)="showAll = true" />
                    </p-tabpanel>

                    <!-- Manual: una sección por vez, elegida en el índice, con sus subtemas
                         plegados; o "Todo el manual" seguido y abierto. El buscador achica el
                         índice y abre los subtemas que mencionan lo buscado. -->
                    <p-tabpanel value="manual">
                        <div *ngIf="manualError" class="text-muted-color">No se pudo cargar el manual. Probá recargar la página.</div>
                        <div *ngIf="!sections.length && !manualError" class="text-muted-color">Cargando el manual…</div>

                        <div *ngIf="sections.length" class="grid grid-cols-12 gap-6">
                            <aside class="col-span-12 lg:col-span-3">
                                <div class="lg:sticky lg:top-24 flex flex-col gap-3">
                                    <input pInputText type="text" class="w-full" placeholder="Buscar en el manual…" [(ngModel)]="manualSearch" (ngModelChange)="onManualSearch()" />
                                    <div *ngIf="manualSearch.trim()" class="text-xs text-muted-color">{{ visibleSections().length }} de {{ sections.length }} secciones</div>
                                    <p-button label="Descargar PDF" icon="pi pi-download" [outlined]="true" size="small" styleClass="w-full" pTooltip="Abre la impresión del manual completo: elegí «Guardar como PDF»" tooltipPosition="bottom" (click)="downloadManual()" />
                                    <nav class="flex flex-col gap-0.5 max-h-60 lg:max-h-[70vh] overflow-y-auto pr-1">
                                        <button
                                            type="button"
                                            class="text-left text-sm px-2 py-1.5 rounded mb-1"
                                            [ngClass]="selectedId === ALL ? 'bg-primary-50 dark:bg-primary-900/40 text-primary font-medium' : 'hover:bg-surface-100 dark:hover:bg-surface-800'"
                                            (click)="select(ALL)"
                                        >
                                            <i class="pi pi-book mr-1"></i> Todo el manual
                                        </button>
                                        <button
                                            *ngFor="let s of visibleSections()"
                                            type="button"
                                            class="text-left text-sm px-2 py-1.5 rounded"
                                            [ngClass]="s.id === selectedId ? 'bg-primary-50 dark:bg-primary-900/40 text-primary font-medium' : 'hover:bg-surface-100 dark:hover:bg-surface-800'"
                                            (click)="select(s.id)"
                                        >
                                            {{ s.title }}
                                        </button>
                                    </nav>
                                </div>
                            </aside>
                            <div class="col-span-12 lg:col-span-9" #manualTop>
                                <div *ngIf="!visibleSections().length" class="text-muted-color">Ninguna sección del manual menciona "{{ manualSearch }}".</div>
                                <ng-container *ngIf="selectedId === ALL">
                                    <app-manual-section *ngFor="let s of visibleSections()" [section]="s" [query]="manualSearch" [expandAll]="true" />
                                </ng-container>
                                <ng-container *ngIf="selected() as current">
                                    <app-manual-section [section]="current" [query]="manualSearch" />
                                    <div class="flex justify-between gap-3 mt-8 pt-4 border-t border-surface-200 dark:border-surface-700">
                                        <p-button *ngIf="neighbor(-1) as prev" [label]="prev.title" icon="pi pi-arrow-left" [text]="true" size="small" (click)="select(prev.id)" />
                                        <span></span>
                                        <p-button *ngIf="neighbor(1) as next" [label]="next.title" icon="pi pi-arrow-right" iconPos="right" [text]="true" size="small" (click)="select(next.id)" />
                                    </div>
                                </ng-container>
                            </div>
                        </div>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </div>
    `,
})
export class Novedades implements OnInit {
    groups: ReleaseGroup[] = groupReleases(RELEASES);
    current = CURRENT_RELEASE;
    tab = 'novedades';
    serverVersion: string | null = null;

    // Novedades
    search = '';
    kinds: ChangeKind[] = [];
    kindOptions = KIND_ORDER.map((k) => ({ label: KIND_LABELS[k], value: k }));
    showAll = false;
    private open = new Set<string>([this.groups[0]?.key ?? '']);

    // Manual
    sections: ManualSection[] = [];
    manualSearch = '';
    manualError = false;
    selectedId: string | null = null;
    readonly ALL = 'todo';
    @ViewChild('manualTop') manualTop?: ElementRef<HTMLElement>;

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

    /** De la más nueva a la más vieja (la principal al final); al buscar, sólo las que coinciden. */
    groupReleasesShown(group: ReleaseGroup): Release[] {
        const all = [...group.updates, group.main];
        return this.filtering() ? all.filter((r) => this.filteredChanges(r).length > 0) : all;
    }

    visibleGroups(): ReleaseGroup[] {
        return this.filtering() ? this.groups.filter((g) => this.groupReleasesShown(g).length > 0) : this.groups;
    }

    shownGroups(): ReleaseGroup[] {
        const visible = this.visibleGroups();
        return this.filtering() || this.showAll ? visible : visible.slice(0, RELEASES_SHOWN);
    }

    hiddenCount(): number {
        return this.visibleGroups().length - this.shownGroups().length;
    }

    matchCount(): number {
        return this.visibleGroups().reduce((sum, g) => sum + this.groupReleasesShown(g).reduce((n, r) => n + this.filteredChanges(r).length, 0), 0);
    }

    isOpen(key: string): boolean {
        // Al buscar o filtrar se abren todas, para ver qué coincidió.
        return this.filtering() || this.open.has(key);
    }

    toggle(key: string) {
        if (this.filtering()) return;
        if (this.open.has(key)) this.open.delete(key);
        else this.open.add(key);
    }

    kindCounts(group: ReleaseGroup) {
        const changes = this.groupReleasesShown(group).flatMap((r) => (this.filtering() ? this.filteredChanges(r) : r.changes));
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
            this.selectedId = this.sections[0]?.id ?? null;
        } catch {
            this.manualError = true;
        }
    }

    downloadManual() {
        this.manual.print(`Manual de usuario LECMA v${this.current.version}`);
    }

    visibleSections(): ManualSection[] {
        return this.manual.search(this.sections, this.manualSearch);
    }

    selected(): ManualSection | null {
        return this.visibleSections().find((s) => s.id === this.selectedId) ?? null;
    }

    /** La sección anterior o siguiente dentro de las que se ven (respeta la búsqueda). */
    neighbor(step: 1 | -1): ManualSection | null {
        const list = this.visibleSections();
        const i = list.findIndex((s) => s.id === this.selectedId);
        return i < 0 ? null : (list[i + step] ?? null);
    }

    select(id: string | null) {
        if (!id) return;
        this.selectedId = id;
        // En el celular el índice queda arriba: llevar la vista al comienzo de la sección.
        setTimeout(() => {
            const top = this.manualTop?.nativeElement;
            if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    /** Si la sección elegida deja de coincidir con la búsqueda, se pasa a la primera que sí. */
    onManualSearch() {
        const list = this.visibleSections();
        if (this.selectedId !== this.ALL && list.length && !list.some((s) => s.id === this.selectedId)) this.selectedId = list[0]!.id;
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
