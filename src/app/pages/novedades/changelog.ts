// Registro de versiones que ve el equipo en "Novedades y ayuda".
//
// Cómo publicar una versión nueva:
//   1. Agregar la entrada ARRIBA de todo (la primera es la versión actual).
//   2. Poner el mismo número en "version" de package.json de este proyecto y
//      del backend: la pantalla avisa si las dos partes no coinciden.
//   3. Si cambió cómo se usa algo, actualizar public/manual-usuario.md.
//   4. Al desplegar, marcar el commit en git: git tag v<versión>.
//
// Numeración: MAYOR.MENOR.CORRECCIÓN. Cambios grandes o que cambian la forma
// de trabajar suben la primera cifra; funciones nuevas, la segunda; arreglos,
// la tercera.
//
// Los textos son para el equipo, no para técnicos: qué cambia en su trabajo.

export type ChangeKind = 'nuevo' | 'mejora' | 'correccion' | 'seguridad' | 'importante';

export interface Release {
    version: string;
    /** Fecha de publicación, AAAA-MM-DD. */
    date: string;
    title: string;
    changes: { kind: ChangeKind; text: string }[];
}

export const RELEASES: Release[] = [
    {
        version: '2.0.0',
        date: '2026-10-27',
        title: 'Asistente de IA renovado, historial de estados y más controles',
        changes: [
            { kind: 'importante', text: 'Los servicios nuevos arrancan con IVA 10,5% en el formulario. Si corresponde 21%, cambialo antes de guardar.' },
            { kind: 'importante', text: 'Cada servicio puede tener un solo chofer. Si un viaje lo hicieron dos, cargá un servicio para cada uno.' },
            { kind: 'importante', text: '"General", "Pagados" y "Cancelados" muestran los últimos 3 meses. Para ver servicios anteriores, elegí "Todo" en el selector de período.' },
            { kind: 'importante', text: 'El Analista ahora está dentro del Asistente: hay un solo chat de IA.' },
            { kind: 'nuevo', text: 'Asistente de IA renovado: responde cualquier consulta sobre servicios, gastos, cobranzas y estadísticas, muestra tablas descargables en Excel y gráficos, y recuerda la conversación.' },
            { kind: 'nuevo', text: 'Órdenes de compra: adjuntá una o varias al asistente y te dice a qué servicio corresponde cada una y por qué.' },
            { kind: 'nuevo', text: 'El asistente puede crear y editar servicios y cambiarles el estado. Siempre te muestra la propuesta y nada cambia hasta que tocás "Confirmar".' },
            { kind: 'nuevo', text: 'Historial de estados: el ícono de reloj de cada servicio y de cada reporte muestra cuándo cambió de estado, de qué a qué y quién lo hizo.' },
            { kind: 'nuevo', text: 'Novedades y ayuda: esta sección, con el manual de usuario y lo que trae cada versión.' },
            { kind: 'nuevo', text: 'Estadísticas: la evolución mensual muestra también el neto sin IVA, y hay un gráfico de servicios por tipo.' },
            { kind: 'mejora', text: 'El estado de cada reporte se calcula a partir de sus servicios: pagar un servicio no paga el reporte hasta que estén todos pagados.' },
            { kind: 'mejora', text: 'Los botones "Pendiente Pago" y "Pagado" del reporte aparecen según el estado real del reporte.' },
            { kind: 'mejora', text: 'Los mensajes de error explican el motivo (por ejemplo, qué paso del flujo corresponde) en lugar de un aviso genérico.' },
            { kind: 'correccion', text: 'Algunos usuarios no podían marcar como "Pagado" un reporte ya facturado.' },
            { kind: 'correccion', text: 'Al facturar, los servicios cancelados ya no se suman al total ni vuelven a quedar activos.' },
            { kind: 'correccion', text: 'Armar un reporte ya no puede hacer retroceder servicios pagados ni mezclar servicios de otro cliente o de otro reporte.' },
            { kind: 'correccion', text: 'No se puede facturar dos veces el mismo servicio.' },
            { kind: 'seguridad', text: 'Los PDF de reportes y liquidaciones y los comprobantes sólo se abren con la sesión iniciada. Los links viejos a reportes ya no funcionan sin entrar al sistema.' },
            { kind: 'seguridad', text: 'Se cerraron accesos al servidor que no requerían usuario y contraseña.' }
        ]
    }
];

export const CURRENT_RELEASE = RELEASES[0];
