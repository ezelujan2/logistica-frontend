import { Injectable } from '@angular/core';

/** Una hoja del Excel: su nombre y las filas que van adentro. */
export interface SheetData {
    nombre: string;
    filas: Record<string, any>[];
}

@Injectable({ providedIn: 'root' })
export class StatsExportService {
    /**
     * Genera un .xlsx con una hoja por tabla.
     *
     * La librería se carga recién acá, con import dinámico, para que sus ~400 KB
     * no pesen en la carga inicial de la app: solo se bajan si alguien exporta.
     */
    async exportar(hojas: SheetData[], nombreArchivo: string): Promise<void> {
        const XLSX = await import('xlsx');

        const libro = XLSX.utils.book_new();

        for (const hoja of hojas) {
            if (!hoja.filas.length) continue;
            const pagina = XLSX.utils.json_to_sheet(hoja.filas);
            pagina['!cols'] = this.anchosDeColumna(hoja.filas);
            // Excel no admite nombres de hoja de más de 31 caracteres.
            XLSX.utils.book_append_sheet(libro, pagina, hoja.nombre.slice(0, 31));
        }

        if (!libro.SheetNames.length) throw new Error('No hay datos para exportar');

        XLSX.writeFile(libro, nombreArchivo);
    }

    /** Ancho de cada columna según el contenido más largo, para que no salga todo cortado. */
    private anchosDeColumna(filas: Record<string, any>[]): { wch: number }[] {
        const columnas = Object.keys(filas[0] ?? {});
        return columnas.map((col) => {
            const largos = filas.map((f) => String(f[col] ?? '').length);
            return { wch: Math.min(40, Math.max(col.length, ...largos) + 2) };
        });
    }
}
