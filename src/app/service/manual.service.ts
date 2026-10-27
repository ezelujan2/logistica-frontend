import { Injectable, SecurityContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { marked } from 'marked';

export interface ManualSection {
    id: string;
    title: string;
    html: SafeHtml;
    searchText: string;
}

/** Para buscar sin importar acentos ni mayúsculas. */
export function normalizeText(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Qué secciones del manual explican cada pantalla, por palabras del título de
// la sección (sin el número, que puede cambiar). La primera que coincide manda.
const HELP_BY_ROUTE: Array<[RegExp, string[]]> = [
    [/^\/app\/services\/(created|pending)$/, ['cargar un servicio', 'lista de servicios']],
    [/^\/app\/services\/pending_details/, ['enviar detalles', 'lista de servicios']],
    [/^\/app\/services\/pending_invoice/, ['facturar', 'lista de servicios']],
    [/^\/app\/services\/payment_pending/, ['registrar cobros', 'lista de servicios']],
    [/^\/app\/services/, ['lista de servicios', 'cargar un servicio']],
    [/^\/app\/expenses/, ['gastos y reintegros']],
    [/^\/app\/(advances|settlements)/, ['liquidar a un chofer']],
    [/^\/app\/(clients|vehicles)\/\d+\/stats/, ['estadisticas']],
    [/^\/app\/(drivers|clients|vehicles)/, ['clientes, choferes, autos']],
    [/^\/app\/statistics/, ['estadisticas']],
    [/^\/app\/reminders/, ['vencimientos']],
    [/^\/app\/assistant/, ['asistente de ia']],
    [/^\/app\/surveys/, ['encuestas']],
    [/^\/app\/users/, ['administrar usuarios']],
    [/^\/app\/sistema/, ['estado del sistema']],
    [/^\/app\/novedades/, ['como usar este manual']],
    [/.*/, ['menu y la pantalla de inicio']]
];

// El manual viaja con cada versión de las pantallas (public/manual-usuario.md),
// así que siempre describe lo que está instalado. Se baja una vez por sesión.
@Injectable({ providedIn: 'root' })
export class ManualService {
    private sections?: Promise<ManualSection[]>;

    constructor(
        private http: HttpClient,
        private sanitizer: DomSanitizer
    ) {}

    getSections(): Promise<ManualSection[]> {
        if (!this.sections) {
            this.sections = firstValueFrom(this.http.get('/manual-usuario.md', { responseType: 'text' })).then((md) => this.split(md));
            this.sections.catch(() => (this.sections = undefined));
        }
        return this.sections;
    }

    /** Las secciones que explican la pantalla de esa dirección, más las preguntas frecuentes. */
    async sectionsFor(url: string): Promise<ManualSection[]> {
        const all = await this.getSections();
        const path = url.split('?')[0]!.split('#')[0]!;
        const keys = HELP_BY_ROUTE.find(([re]) => re.test(path))![1];
        const byKey = (key: string) => all.find((s) => normalizeText(s.title).includes(key));
        const picked = keys.map(byKey).filter((s): s is ManualSection => !!s);
        const faq = byKey('preguntas frecuentes');
        return faq && !picked.includes(faq) ? [...picked, faq] : picked;
    }

    search(sections: ManualSection[], query: string): ManualSection[] {
        const q = normalizeText(query.trim());
        return q ? sections.filter((s) => s.searchText.includes(q)) : sections;
    }

    /** Parte el manual en sus secciones "## …" para armar índices y buscar. */
    private split(markdown: string): ManualSection[] {
        return markdown
            .split(/^(?=## )/m)
            .filter((c) => c.trim())
            .map((chunk, i) => {
                const title = (chunk.match(/^## (.+)$/m)?.[1] ?? 'Introducción').trim();
                const html = marked.parse(chunk, { async: false }) as string;
                const safe = this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
                return {
                    id: `manual-${i}`,
                    title,
                    html: this.sanitizer.bypassSecurityTrustHtml(safe),
                    searchText: normalizeText(chunk.replace(/[#*|`>_-]/g, ' '))
                };
            });
    }
}
