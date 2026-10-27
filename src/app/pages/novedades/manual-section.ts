import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManualSection, ManualSubsection, normalizeText } from '../../service/manual.service';

// Una sección del manual: la introducción a la vista y cada subtema plegado,
// para que no sea una pared de texto. Si hay una búsqueda, se abren solos los
// subtemas que la mencionan. Se usa en Novedades y en el panel de ayuda.
@Component({
    selector: 'app-manual-section',
    standalone: true,
    imports: [CommonModule],
    template: `
        <section class="lecma-manual">
            <div [innerHTML]="section.intro"></div>
            <div *ngIf="section.subsections.length" class="lecma-manual-subs">
                <details *ngFor="let sub of section.subsections" [open]="isOpen(sub)" (toggle)="remember(sub, $event)">
                    <summary>{{ sub.title }}</summary>
                    <div class="lecma-manual-sub-body" [innerHTML]="sub.html"></div>
                </details>
            </div>
        </section>
    `
})
export class ManualSectionView {
    @Input({ required: true }) section!: ManualSection;
    /** Texto buscado: abre los subtemas que lo contienen. */
    @Input() query = '';
    /** Todos los subtemas abiertos (para ver el manual entero de corrido). */
    @Input() expandAll = false;

    // Lo que el usuario abrió o cerró a mano, para no pisarlo en cada render.
    private manual = new Map<ManualSubsection, boolean>();
    private lastQuery = '';

    isOpen(sub: ManualSubsection): boolean {
        if (this.query !== this.lastQuery) {
            this.manual.clear();
            this.lastQuery = this.query;
        }
        if (this.manual.has(sub)) return this.manual.get(sub)!;
        if (this.expandAll) return true;
        const q = normalizeText(this.query.trim());
        // Una sección con un solo subtema no tiene sentido plegada.
        return q ? sub.searchText.includes(q) : this.section.subsections.length === 1;
    }

    remember(sub: ManualSubsection, event: Event) {
        this.manual.set(sub, (event.target as HTMLDetailsElement).open);
    }
}
