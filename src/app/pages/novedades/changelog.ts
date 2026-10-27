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
        version: '2.2.0',
        date: '2026-10-27',
        title: 'Ayuda en cada pantalla, historial del sistema y control de ingresos',
        changes: [
            { kind: 'nuevo', text: 'Ayuda en cada pantalla: el botón con el signo de pregunta (?) de la barra de arriba muestra la parte del manual que explica la pantalla en la que estás, con un buscador para el resto. Lo tienen todos los usuarios.' },
            { kind: 'nuevo', text: 'El asistente responde dudas sobre cómo usar el sistema ("¿cómo corrijo el número de una factura?") con los pasos del manual, según el rol de cada uno.' },
            { kind: 'nuevo', text: 'Estado del sistema (sólo administradores): historial de pedidos, tiempos de respuesta y uso del servidor de 24 horas, 7, 30 o 90 días.' },
            { kind: 'nuevo', text: 'Estado del sistema: control de los respaldos de la base de datos, con aviso si el último está atrasado o salió incompleto.' },
            { kind: 'seguridad', text: 'Estado del sistema: panel de ingresos con los intentos fallidos, usuarios bloqueados, las IPs y cuentas con más fallos y los ingresos desde un lugar nuevo.' },
            { kind: 'mejora', text: 'Novedades: la versión actual aparece abierta y las anteriores resumidas; se puede buscar un tema en todas las versiones y filtrar por tipo de cambio.' },
            { kind: 'mejora', text: 'Manual de usuario: índice para saltar a cada sección y un buscador que muestra sólo las secciones que hablan de lo que buscás.' },
            { kind: 'mejora', text: 'Estado del sistema (sólo administradores): la lista de errores se puede buscar, filtrar, ordenar y paginar, y tiene un acceso directo a Sentry.' },
            { kind: 'correccion', text: 'El límite de intentos de inicio de sesión se contaba para todo el equipo junto: si entre todos se sumaban muchos ingresos en pocos minutos, nadie podía entrar. Ahora se cuenta para cada persona por separado.' }
        ]
    },
    {
        version: '2.1.0',
        date: '2026-10-27',
        title: 'Estado del sistema y aviso de errores',
        changes: [
            { kind: 'nuevo', text: 'Estado del sistema (sólo administradores): una pantalla con la salud del sistema, el uso del servidor (CPU, memoria y disco), la base de datos, los pedidos y errores de las últimas 24 horas, el costo del asistente y los errores abiertos.' },
            { kind: 'nuevo', text: 'Aviso de errores: cuando algo falla, queda registrado automáticamente con la pantalla y el momento en que ocurrió, para poder corregirlo sin que nadie tenga que reportarlo.' }
        ]
    },
    {
        version: '2.0.0',
        date: '2026-10-26',
        title: 'Asistente de IA renovado, historial de estados y más controles',
        changes: [
            { kind: 'importante', text: 'Los servicios nuevos arrancan con IVA 10,5% en el formulario. Si corresponde 21%, cambialo antes de guardar.' },
            { kind: 'importante', text: 'Cada servicio puede tener un solo chofer. Si un viaje lo hicieron dos, cargá un servicio para cada uno.' },
            { kind: 'importante', text: '"General", "Pagados" y "Cancelados" muestran los últimos 3 meses. Para ver servicios anteriores, elegí "Todo" en el selector de período.' },
            { kind: 'importante', text: 'El Analista ahora está dentro del Asistente: hay un solo chat de IA.' },
            { kind: 'nuevo', text: 'Asistente de IA renovado: responde cualquier consulta sobre servicios, gastos, cobranzas y estadísticas, muestra tablas descargables en Excel y gráficos, y recuerda la conversación.' },
            { kind: 'nuevo', text: 'Órdenes de compra: adjuntá una o varias al asistente y te dice a qué servicio corresponde cada una y por qué.' },
            { kind: 'nuevo', text: 'El asistente puede crear y editar servicios y cambiarles el estado. Siempre te muestra la propuesta y nada cambia hasta que tocás "Confirmar".' },
            { kind: 'nuevo', text: 'Historial del servicio (sólo administradores): el ícono de reloj muestra todo lo que le pasó a un servicio (alta, cada dato modificado con su valor anterior y nuevo, cambios de chofer, gastos y estados) con fecha y usuario.' },
            { kind: 'nuevo', text: 'Historial del reporte (sólo administradores): el ícono de reloj en la cabecera del reporte muestra los cambios de estado del reporte y de todos sus servicios.' },
            { kind: 'nuevo', text: 'Novedades y ayuda (administradores y dirección): esta sección, con el manual de usuario y lo que trae cada versión.' },
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
