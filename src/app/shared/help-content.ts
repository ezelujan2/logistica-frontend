export interface HelpSection {
    title: string;
    content: string;
}

export interface HelpPage {
    title: string;
    description: string;
    sections: HelpSection[];
}

export const HELP_CONTENT: Record<string, HelpPage> = {
    dashboard: {
        title: 'Inicio / Dashboard',
        description: 'Panel principal con resumen general del estado del sistema.',
        sections: [
            {
                title: 'Tarjetas de resumen',
                content: 'Las tarjetas superiores muestran indicadores clave: <strong>Viajes Hoy</strong> (servicios del día actual), <strong>Pendientes Acción</strong> (servicios en estado Creado o Pendiente que necesitan atención), <strong>A Facturar</strong> (servicios listos para facturar) y <strong>Pendiente Pago</strong> (servicios facturados esperando cobro).'
            },
            {
                title: 'Próximos servicios',
                content: 'Tabla con los servicios programados para los próximos 7 días. Podés hacer click en cualquier servicio para ir a su detalle. Usa las columnas para ordenar por fecha, cliente o destino.'
            },
            {
                title: 'Tareas pendientes',
                content: 'Lista lateral con servicios que requieren acción, organizados por estado. Cada color indica un estado diferente: <strong>amarillo</strong> = creado, <strong>azul</strong> = pendiente, <strong>violeta</strong> = pendiente factura, <strong>naranja</strong> = pendiente pago.'
            },
            {
                title: 'Log de auditoría',
                content: 'Registro de los últimos cambios realizados en el sistema. Muestra quién hizo cada cambio, en qué módulo y cuándo. Podés filtrar por módulo usando el selector y buscar por texto. Hacé click en "Ver detalle" para ver exactamente qué campos se modificaron (antes y después).'
            }
        ]
    },

    services: {
        title: 'Servicios (Viajes)',
        description: 'Gestión completa de servicios de transporte/logística.',
        sections: [
            {
                title: 'Ciclo de vida de un servicio',
                content: 'Cada servicio pasa por estados: <strong>Creado</strong> → <strong>Pendiente</strong> → <strong>Env. Detalles</strong> (se agrupan y envían al cliente) → <strong>A Facturar</strong> (cliente confirmó) → <strong>Pendiente Pago</strong> (factura emitida) → <strong>Pagado</strong>. También puede ser <strong>Cancelado</strong> en cualquier momento.'
            },
            {
                title: 'Crear un servicio',
                content: 'Click en "Nuevo Servicio". Completá: fecha inicio/fin, tipo de servicio, origen, destino, cliente, chofer y vehículo. Los KM recorridos y horas de espera determinan el monto. Los precios se toman automáticamente de la configuración de tarifas o del cliente.'
            },
            {
                title: 'Acciones masivas',
                content: 'Seleccioná múltiples servicios con los checkboxes de la izquierda. Según el estado, aparecen diferentes acciones: <strong>Agrupar</strong> (crea un reporte para enviar al cliente), <strong>Facturar</strong> (asigna número de factura), <strong>Marcar como pagado</strong>.'
            },
            {
                title: 'Agrupar servicios',
                content: 'Seleccioná servicios del mismo cliente y hacé click en "Agrupar". Se genera un código de grupo (REP-0001) y un PDF con el detalle de todos los servicios. Este reporte se envía al cliente para que confirme los viajes antes de facturar.'
            },
            {
                title: 'Vistas',
                content: 'Usá los botones de vista para alternar entre: <strong>Lista</strong> (tabla estándar), <strong>Calendario</strong> (vista mensual/semanal) y <strong>Agrupado</strong> (organizado por código de grupo). El menú lateral filtra por estado.'
            },
            {
                title: 'Filtros',
                content: 'Podés filtrar por rango de fechas, cliente, chofer, vehículo, estado y tipo de servicio. El buscador general busca en ruta, estado, clientes, código de grupo y número de factura.'
            }
        ]
    },

    clients: {
        title: 'Clientes',
        description: 'Gestión de empresas y personas que contratan servicios de transporte.',
        sections: [
            {
                title: 'Agregar un cliente',
                content: 'Click en "Nuevo" para abrir el formulario. Los campos principales son: <strong>Nombre</strong> (nombre de la empresa o persona), <strong>CUIT</strong> (identificación fiscal), <strong>Teléfono</strong>, <strong>Email</strong> y <strong>Dirección</strong>.'
            },
            {
                title: 'Precios por defecto',
                content: 'Cada cliente puede tener precios personalizados: <strong>Precio por KM</strong> y <strong>Precio extra KM</strong>. Cuando se crea un servicio para este cliente, estos precios se usan automáticamente en vez de la tarifa general.'
            },
            {
                title: 'Opciones de envío',
                content: '<strong>Enviar detalles</strong>: si está activado, el sistema envía automáticamente los reportes de servicio al email del cliente. <strong>Enviar facturas</strong>: envía las facturas por email.'
            },
            {
                title: 'Condiciones de pago',
                content: 'El campo <strong>Condiciones de pago</strong> permite registrar los términos acordados (ej: "30 días", "contado"). Las <strong>Notas</strong> son para información interna sobre el cliente.'
            }
        ]
    },

    drivers: {
        title: 'Choferes',
        description: 'Gestión de conductores que realizan los servicios de transporte.',
        sections: [
            {
                title: 'Datos del chofer',
                content: 'Cada chofer tiene: <strong>Nombre</strong>, <strong>Teléfono</strong>, <strong>Email</strong>, <strong>CUIT</strong> y <strong>Número de licencia</strong>. El CUIT es necesario para las liquidaciones.'
            },
            {
                title: 'Relación con servicios',
                content: 'Los choferes se asignan a servicios. Un servicio puede tener múltiples choferes y un chofer puede estar en múltiples servicios. El monto que recibe el chofer (driver_amount) se calcula según la tarifa configurada.'
            },
            {
                title: 'Documentos',
                content: 'Desde la sección de documentos podés cargar licencia de conducir, certificado médico y otros documentos obligatorios con su fecha de vencimiento. El sistema alerta cuando un documento está por vencer.'
            }
        ]
    },

    vehicles: {
        title: 'Vehículos',
        description: 'Gestión de la flota de vehículos disponibles para servicios.',
        sections: [
            {
                title: 'Datos del vehículo',
                content: 'Cada vehículo tiene: <strong>Patente</strong> (placa), <strong>Modelo</strong> y <strong>Tipo de propiedad</strong>.'
            },
            {
                title: 'Tipo de propiedad',
                content: '<strong>Propio</strong>: vehículo de la empresa. <strong>Tercero</strong>: vehículo de un tercero (chofer o empresa externa). Esta distinción es importante para el cálculo de costos y gastos asociados.'
            },
            {
                title: 'Documentos',
                content: 'Desde la sección de documentos podés cargar seguro, VTV (verificación técnica), habilitación de transporte y otros documentos con fecha de vencimiento.'
            }
        ]
    },

    advances: {
        title: 'Adelantos',
        description: 'Gestión de adelantos de dinero entregados a los choferes.',
        sections: [
            {
                title: '¿Qué es un adelanto?',
                content: 'Un adelanto es un pago anticipado que se le entrega a un chofer antes de la liquidación. Puede ser para viáticos, combustible u otros gastos. Los adelantos se descuentan automáticamente de la próxima liquidación del chofer.'
            },
            {
                title: 'Estados',
                content: '<strong>Pendiente</strong>: el adelanto aún no fue descontado de ninguna liquidación. <strong>Descontado</strong>: el adelanto ya se incluyó en una liquidación y fue restado del monto a pagar.'
            },
            {
                title: 'Crear un adelanto',
                content: 'Click en "Nuevo". Seleccioná el <strong>chofer</strong>, ingresá el <strong>monto</strong>, la <strong>fecha</strong> y una <strong>descripción</strong> (ej: "Adelanto viáticos semana 12"). Los adelantos vinculados a una liquidación pagada no se pueden editar ni eliminar.'
            },
            {
                title: 'Filtrar',
                content: 'Usá el selector de chofer para ver solo los adelantos de un chofer específico. La columna "Estado" muestra si fue descontado o sigue pendiente.'
            }
        ]
    },

    settlements: {
        title: 'Liquidaciones',
        description: 'Cálculo y registro de pagos a choferes por servicios realizados.',
        sections: [
            {
                title: '¿Qué es una liquidación?',
                content: 'Una liquidación es el cálculo del pago que le corresponde a un chofer por un período de trabajo. Incluye: <strong>servicios realizados</strong> (lo que se le paga) menos <strong>adelantos</strong> (lo que ya recibió) más/menos <strong>gastos</strong> (reembolsos pendientes).'
            },
            {
                title: 'Crear una liquidación',
                content: 'Click en "Nueva Liquidación". <strong>Paso 1:</strong> seleccioná el chofer y el rango de fechas. <strong>Paso 2:</strong> el sistema muestra los servicios pendientes, adelantos y gastos del período. Seleccioná qué ítems incluir. El sistema calcula automáticamente el monto total a pagar.'
            },
            {
                title: 'Descargar PDF',
                content: 'Cada liquidación genera un PDF detallado con: listado de servicios, KM recorridos, horas de espera, montos por servicio, adelantos descontados, gastos reembolsables y monto neto a pagar. Incluye espacio para firmas.'
            },
            {
                title: 'Estados',
                content: '<strong>Borrador</strong>: liquidación creada pero no confirmada, se puede editar. <strong>Procesada</strong>: liquidación confirmada, lista para pagar. <strong>Pagada</strong>: pago realizado al chofer. Una vez pagada, no se pueden modificar los servicios ni adelantos asociados.'
            }
        ]
    },

    expenses: {
        title: 'Gastos',
        description: 'Registro y seguimiento de todos los gastos operativos.',
        sections: [
            {
                title: 'Tipos de gasto',
                content: 'El sistema soporta múltiples tipos: <strong>Combustible</strong>, <strong>Peaje</strong>, <strong>Lavado</strong>, <strong>Snack</strong>, <strong>Mantenimiento</strong>, <strong>Seguro</strong>, <strong>Strix</strong> (rastreo satelital), <strong>Starlink</strong>, <strong>Patentes</strong>, <strong>Media rueda</strong>, <strong>ART</strong>, <strong>Ingresos brutos</strong>, <strong>Contadores</strong>, <strong>Autónomos</strong>, <strong>Estacionamiento</strong>, <strong>Movilidad</strong>, <strong>Mantenimiento web</strong>, <strong>IVA</strong>, <strong>Ganancias</strong> y <strong>Otros</strong>.'
            },
            {
                title: 'Asociar gastos',
                content: 'Un gasto puede asociarse a: un <strong>servicio</strong> específico (ej: peaje de un viaje), un <strong>chofer</strong> (ej: viáticos), un <strong>vehículo</strong> (ej: combustible, mantenimiento) o ninguno (gastos generales de la empresa).'
            },
            {
                title: 'Gasto de chofer',
                content: 'Si marcás un gasto como <strong>"Gasto de chofer"</strong>, significa que el chofer pagó de su bolsillo y se le debe reembolsar. Estos gastos aparecen en la liquidación del chofer como montos a favor.'
            },
            {
                title: 'Filtros',
                content: 'Filtrá por <strong>año</strong> y <strong>mes</strong> para ver los gastos de un período específico. La tabla muestra tipo, monto, fecha, descripción y las asociaciones (chofer/vehículo).'
            }
        ]
    },

    statistics: {
        title: 'Estadísticas',
        description: 'Dashboard analítico con indicadores de rendimiento del negocio.',
        sections: [
            {
                title: 'Modos de visualización',
                content: 'Podés ver las estadísticas en modo <strong>Mensual</strong> (un mes específico), <strong>Trimestral</strong> (3 meses) o <strong>Anual</strong> (todo el año). Usá los selectores de año y mes para cambiar el período.'
            },
            {
                title: 'Indicadores principales',
                content: '<strong>Ingresos totales</strong>: suma de todos los servicios facturados. <strong>Gastos totales</strong>: suma de todos los gastos registrados. <strong>Ganancia neta</strong>: ingresos menos gastos. <strong>Costo promedio por servicio</strong>: gastos dividido cantidad de servicios.'
            },
            {
                title: 'Cuentas por cobrar',
                content: 'El panel de alertas muestra: cantidad de facturas <strong>pendientes de cobro</strong>, cantidad de facturas <strong>vencidas</strong> (más de 30 días) y el <strong>monto total pendiente</strong>. Si hay facturas vencidas, se muestra una alerta en rojo.'
            },
            {
                title: 'Filtro por tipo de servicio',
                content: 'El multi-selector de tipos de servicio permite filtrar las estadísticas para ver solo determinados tipos (ej: solo Servicios, solo Mensajería, etc.).'
            },
            {
                title: 'Rankings',
                content: 'Las tablas de <strong>Top Choferes</strong> y <strong>Top Clientes</strong> muestran los 10 más activos por cantidad de viajes e ingresos/costos generados. Útil para identificar los principales generadores de negocio.'
            }
        ]
    },

    quotes: {
        title: 'Cotizaciones',
        description: 'Sistema de presupuestos para cotizar servicios antes de confirmarlos.',
        sections: [
            {
                title: '¿Qué es una cotización?',
                content: 'Una cotización es un presupuesto que se envía a un cliente potencial o existente antes de confirmar un servicio. Permite estimar el costo de uno o más viajes y enviar un documento profesional al cliente para su aprobación.'
            },
            {
                title: 'Flujo de trabajo',
                content: '<strong>1. Crear:</strong> ingresá los datos del cliente y los viajes a cotizar. <strong>2. Enviar:</strong> se genera un PDF y se envía por email al cliente. <strong>3. Seguimiento:</strong> seguí el estado de la cotización. <strong>4. Resultado:</strong> si el cliente acepta, convertí la cotización en servicio(s) con un click.'
            },
            {
                title: 'Estados',
                content: '<strong>Borrador</strong>: cotización creada pero no enviada. <strong>Enviada</strong>: se envió al cliente. <strong>Aceptada</strong>: el cliente confirmó. <strong>Rechazada</strong>: el cliente no aceptó. <strong>Vencida</strong>: pasó la fecha de validez. <strong>Convertida</strong>: se crearon servicios a partir de esta cotización.'
            },
            {
                title: 'Convertir a servicio',
                content: 'Cuando una cotización es aceptada, el botón "Convertir a Servicio" crea automáticamente los servicios con los datos pre-cargados (cliente, origen, destino, precios). Solo falta completar fecha exacta, chofer y vehículo.'
            },
            {
                title: 'Link público',
                content: 'Cada cotización tiene un link público que podés compartir con el cliente. Desde ahí, el cliente puede ver el detalle de la cotización y aceptarla o rechazarla online, firmando con su nombre.'
            }
        ]
    },

    'quote-quick': {
        title: 'Cotización Rápida',
        description: 'Formulario simplificado para cotizar rápidamente por teléfono.',
        sections: [
            {
                title: '¿Cuándo usar la cotización rápida?',
                content: 'Usá este formulario cuando un cliente llama por teléfono y necesitás darle un precio al instante. Es más simple que el formulario completo de cotización.'
            },
            {
                title: 'Cómo funciona',
                content: 'Ingresá el nombre del cliente (podés seleccionar uno existente o escribir el nombre de un prospecto nuevo), el <strong>origen</strong>, <strong>destino</strong>, <strong>tipo de servicio</strong> y los <strong>KM estimados</strong>. El sistema calcula el precio automáticamente usando la tarifa favorita configurada.'
            },
            {
                title: 'Acciones',
                content: '<strong>Guardar como borrador</strong>: crea la cotización sin enviarla, para completarla después. <strong>Enviar</strong>: crea la cotización y la envía directamente al email del cliente.'
            }
        ]
    },

    'quote-templates': {
        title: 'Plantillas de Cotización',
        description: 'Plantillas reutilizables para cotizar rutas frecuentes.',
        sections: [
            {
                title: '¿Para qué sirven?',
                content: 'Si cotizás frecuentemente las mismas rutas o tipos de servicio, podés guardarlos como plantilla. Así, la próxima vez que necesites cotizar esa ruta, solo seleccionás la plantilla y los datos se completan automáticamente.'
            },
            {
                title: 'Crear una plantilla',
                content: 'Click en "Nueva Plantilla". Completá: <strong>nombre</strong> (ej: "Ezeiza - Centro"), <strong>tipo de servicio</strong>, <strong>origen</strong>, <strong>destino</strong>, <strong>KM estimados</strong> y los <strong>precios</strong>. Opcionalmente podés asociarla a un cliente específico.'
            },
            {
                title: 'Favoritas',
                content: 'Marcá una plantilla como <strong>favorita</strong> para que aparezca primero en la lista al crear cotizaciones. Ideal para las rutas más frecuentes.'
            }
        ]
    },

    'quote-public': {
        title: 'Cotización - Vista de Cliente',
        description: 'Página donde el cliente puede ver y responder a una cotización.',
        sections: [
            {
                title: 'Ver la cotización',
                content: 'Esta página muestra el detalle completo de la cotización: datos de la empresa, detalle de los servicios cotizados, precios, descuentos y monto total.'
            },
            {
                title: 'Aceptar',
                content: 'Si está de acuerdo con la cotización, presione el botón <strong>"Aceptar Cotización"</strong>. Se le pedirá su nombre completo como firma digital. La aceptación queda registrada con fecha, hora y nombre.'
            },
            {
                title: 'Rechazar',
                content: 'Si no está de acuerdo, presione <strong>"Rechazar"</strong>. Opcionalmente puede indicar el motivo del rechazo para que la empresa pueda enviar una nueva cotización ajustada.'
            }
        ]
    },

    documents: {
        title: 'Vencimientos de Documentos',
        description: 'Control de documentación obligatoria de choferes y vehículos.',
        sections: [
            {
                title: '¿Qué se controla?',
                content: 'El sistema controla la vigencia de documentos obligatorios: <strong>Licencia de conducir</strong>, <strong>Certificado médico</strong>, <strong>Seguro del vehículo</strong>, <strong>VTV</strong> (Verificación Técnica Vehicular), <strong>Habilitación de transporte</strong> y otros documentos personalizados.'
            },
            {
                title: 'Alertas de vencimiento',
                content: 'El sistema muestra alertas cuando un documento está por vencer: <strong>30 días antes</strong> (alerta amarilla), <strong>15 días antes</strong> (alerta naranja), <strong>7 días antes</strong> (alerta roja). Los documentos ya vencidos se muestran con alerta crítica.'
            },
            {
                title: 'Cargar documentos',
                content: 'Desde la ficha del chofer o vehículo, agregá documentos indicando: <strong>tipo</strong>, <strong>fecha de vencimiento</strong> y opcionalmente un <strong>archivo adjunto</strong> (foto o PDF del documento). También podés agregar notas.'
            },
            {
                title: 'Impacto en servicios',
                content: 'Al crear un servicio, si el chofer o vehículo seleccionado tiene documentos vencidos, el sistema muestra una advertencia. Esto ayuda a prevenir problemas legales y operativos.'
            }
        ]
    },

    configuration: {
        title: 'Configuración de Tarifas',
        description: 'Gestión de tarifas y precios del sistema.',
        sections: [
            {
                title: 'Tarifas',
                content: 'El sistema permite configurar múltiples tarifas con nombre. Cada tarifa incluye: <strong>Precio por KM</strong> (cliente), <strong>Precio hora espera</strong> (cliente), <strong>Precio extra KM</strong> (cliente), <strong>Precio KM chofer</strong> y <strong>Precio hora chofer</strong>.'
            },
            {
                title: 'Tarifa favorita',
                content: 'La tarifa marcada como <strong>favorita</strong> es la que se usa por defecto al crear servicios nuevos (a menos que el cliente tenga precios propios configurados).'
            },
            {
                title: 'Aumento masivo',
                content: 'El botón de <strong>aumento masivo</strong> permite aumentar todos los precios de todas las tarifas en un porcentaje. Podés aplicar un porcentaje diferente para precios de cliente y precios de chofer.'
            }
        ]
    }
};
