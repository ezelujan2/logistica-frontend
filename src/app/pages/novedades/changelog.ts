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
        version: '2.5.0',
        date: '2026-10-28',
        title: 'Flete, manual en PDF y nombres en castellano',
        changes: [
            { kind: 'nuevo', text: 'Servicios: nuevo tipo "Flete" para traslados de carga. Se cobra por km y horas como un servicio común, y aparece en los filtros, las estadísticas, las liquidaciones y el asistente.' },
            { kind: 'nuevo', text: 'Manual de usuario: botón "Descargar PDF" para guardarlo completo y leerlo sin conexión o compartirlo.' },
            { kind: 'correccion', text: 'Estados y tipos se ven con su nombre en castellano en todo el sistema: liquidaciones, gastos, auditoría, buscador, estadísticas y mensajes de error ya no muestran nombres internos como "PROCESSED" o "STRIX".' }
        ]
    },
    {
        version: '2.4.3',
        date: '2026-10-27',
        title: 'Orden de las novedades e historial del sistema',
        changes: [
            { kind: 'mejora', text: 'Novedades: cada tarjeta muestra el número de la última versión, y adentro las actualizaciones van de la más nueva a la más vieja.' },
            { kind: 'correccion', text: 'Estado del sistema: el historial de 24 horas aparecía casi vacío después de cada actualización del sistema. Ahora muestra lo guardado hora por hora más la hora en curso.' },
            { kind: 'mejora', text: 'Estado del sistema: en el historial de 7 días el eje marca el comienzo de cada día, y al pasar el mouse se ve el día y la hora. Las horas sin datos quedan vacías en lugar de en cero.' }
        ]
    },
    {
        version: '2.4.2',
        date: '2026-10-27',
        title: 'Agenda con horario y calendario de cada chofer',
        changes: [
            { kind: 'mejora', text: 'Agenda: al cargar algo se elige "Con horario" (un día, de tal hora a tal hora; arranca con 1 hora de duración), "Todo el día" o "Varios días". Si cambiás la hora de inicio, la de fin se corre sola.' },
            { kind: 'nuevo', text: 'Calendario de cada chofer: en su ficha se pega el ID de un calendario de Google y el sistema le copia ahí sus servicios (con detalles y notas, sin importes) y sus días no disponibles. Así cada chofer ve sólo lo suyo en el celular.' },
            { kind: 'mejora', text: 'Novedades: las actualizaciones chicas (como 2.4.1 y 2.4.2) se muestran dentro de su versión, en una sola tarjeta.' }
        ]
    },
    {
        version: '2.4.1',
        date: '2026-10-27',
        title: 'Arreglo de la copia a Google Calendar',
        changes: [
            { kind: 'correccion', text: 'Google Calendar: algunos vencimientos, servicios y entradas de la agenda no se copiaban (los de número más bajo). Ya se copian todos.' },
            { kind: 'mejora', text: 'Google Calendar: si un evento no se puede copiar, los demás se copian igual, y Estado del sistema muestra cuántos fallaron.' }
        ]
    },
    {
        version: '2.4.0',
        date: '2026-10-27',
        title: 'Agenda de autos y choferes y Google Calendar',
        changes: [
            { kind: 'nuevo', text: 'Agenda: se carga cuándo un auto está en taller, service o VTV, cuándo un chofer no puede trabajar y cualquier otro evento. Todo aparece en el calendario de servicios, con borde punteado.' },
            { kind: 'nuevo', text: 'Al cargar o editar un servicio, si el auto o el chofer no están disponibles en ese horario (o tienen el seguro, la VTV o el carnet vencidos), aparece un aviso. Es sólo un aviso: se puede guardar igual.' },
            { kind: 'nuevo', text: 'Al cargar un taller o un día en que un chofer no puede, si ya hay servicios con ese auto o chofer en esas fechas, el sistema los muestra para revisarlos.' },
            { kind: 'nuevo', text: 'Services de los autos: se anota a qué km se hizo y a qué km toca el próximo, y la Agenda muestra cuántos km le faltan a cada auto según los viajes cargados.' },
            { kind: 'nuevo', text: 'Google Calendar: los servicios, la agenda y los vencimientos se copian solos a tres calendarios de Google de LECMA, para verlos desde el celular. Es sólo para mirar: todo se sigue cargando en LECMA.' },
            { kind: 'mejora', text: 'Asistente: al cruzar una orden de pago con los servicios, usa el número de factura que trae (por ejemplo 00001-00000003 = F003). Sirve cuando un cliente tiene varios viajes por el mismo importe.' }
        ]
    },
    {
        version: '2.3.0',
        date: '2026-10-27',
        title: 'Cargar la semana de un cliente desde una foto',
        changes: [
            { kind: 'nuevo', text: 'Asistente: le pasás la foto o planilla con los viajes de la semana de un cliente y arma todos los servicios juntos en una tabla, para confirmar con un solo botón.' },
            { kind: 'nuevo', text: 'El chofer, el auto y los km se completan según cómo se vienen cargando los viajes de ese cliente, y cada viaje dura 1 hora salvo que la planilla diga otra cosa. Si cambia el chofer habitual, el sistema lo propone solo, y en la tabla se puede cambiar el chofer de cada viaje o destildar los que no van.' },
            { kind: 'mejora', text: 'Los viajes que ya están cargados se marcan y no se duplican, aunque la planilla escriba los lugares distinto ("ROSARIO" y "Ros" cuentan como el mismo lugar).' },
            { kind: 'mejora', text: 'Los servicios cargados así quedan escritos siempre igual (por ejemplo, "Ros → KCC · Vivi · 14 hs"), para encontrarlos y filtrarlos fácil.' },
            { kind: 'mejora', text: 'Novedades: al abrir una versión, los cambios quedan separados del título y con márgenes parejos; en el celular, el tipo de cambio va arriba del texto.' },
            { kind: 'mejora', text: 'Manual de usuario: se lee una sección por vez, con botones para pasar a la anterior o la siguiente (o "Todo el manual" de corrido), y cada subtema aparece plegado para abrir sólo lo que necesitás. Al buscar, se abren solos los subtemas que hablan de lo buscado. Lo mismo en el panel de ayuda (?).' },
            { kind: 'correccion', text: 'Asistente: a veces no podía hacer consultas de datos ("no se pudo conectar") hasta que se reiniciaba el sistema. Ya no pasa.' },
            { kind: 'mejora', text: 'Asistente: cuando algo falla, le avisa al usuario en palabras simples que quedó registrado, sin mostrarle detalles técnicos; el detalle completo queda en Preguntas sin responder para los administradores.' }
        ]
    },
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
