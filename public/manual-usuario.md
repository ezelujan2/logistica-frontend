## 1. Cómo usar este manual

Este manual explica, paso a paso, cómo hacer cada tarea del día a día en el sistema: cargar un viaje, armar un reporte, facturar, cobrar, liquidar a un chofer y consultar información. Cada sección es independiente: andá directo a la tarea que necesitás.

Los nombres entre comillas ("Nuevo Servicio", "Generar Reporte") son los textos exactos de los botones y opciones en pantalla.

El manual describe el sistema con las mejoras de octubre de 2026 (asistente de IA nuevo, historial de estados, selector de período y nuevas validaciones). Si alguna pantalla todavía no coincide, esa mejora aún no se instaló.

### Qué ve cada usuario

Lo que aparece en el menú depende de tu rol. Si no ves una opción que figura en este manual, tu usuario no tiene permiso para usarla.

| Tarea | ADMIN | DIRECTOR | ADMIN\_OPERATIVO |
| --- | --- | --- | --- |
| Servicios, reportes, facturación, cobros | Sí | Sí | Sí |
| Gastos, clientes, choferes, autos, adelantos, liquidaciones, vencimientos | Sí | Sí | Sí |
| Asistente de IA | Sí | Sí | Sí, sin análisis financiero |
| Cambiar tarifas | Sí | Sí | No |
| Estadísticas y encuestas | Sí | Sí | No |
| Administrar usuarios | Sí | Sí | No |
| Corregir el estado de un servicio o reporte salteando pasos | Sí | No | No |

## 2. Ingresar al sistema

Se entra con el correo y la contraseña que te dio el administrador. La sesión dura 24 horas.

1. Entrá a la dirección del sistema y abrí la página de ingreso.
2. Escribí tu correo en "Dirección de correo electrónico" y tu contraseña en "Contraseña". El ícono del ojo muestra lo que escribiste.
3. Tocá "Iniciar sesión" o apretá Enter.

### Si la sesión vence

Pasadas 24 horas, la próxima acción te pide la contraseña de nuevo en una ventana. Al ingresarla, el sistema completa lo que estabas haciendo: no perdés lo cargado.

### Si te equivocás de contraseña

- Al quinto intento fallido la cuenta se **bloquea** y te llega un correo con un enlace para desbloquearla. Abrí ese enlace y volvé a ingresar.
- Si no te llegó el correo, revisá la carpeta de correo no deseado o pedí al administrador que te desbloquee.
- Desde una misma conexión se aceptan hasta 30 intentos cada 15 minutos; pasado ese límite hay que esperar.

### Mensajes que podés ver

| Mensaje | Qué hacer |
| --- | --- |
| Credenciales inválidas | Revisá correo y contraseña (mayúsculas incluidas) |
| Tu cuenta ha sido bloqueada temporalmente | Usá el enlace que llegó por correo |
| No se puede conectar al servidor | Revisá tu conexión a internet; si sigue, avisá al administrador |

## 3. El menú y la pantalla de inicio

La pantalla de inicio muestra de un vistazo qué hay que hacer hoy; el menú de la izquierda lleva a cada sección.

### Pantalla de inicio

| Indicador o bloque | Qué muestra |
| --- | --- |
| Viajes Hoy | Servicios programados para hoy |
| Pendientes Acción | Servicios que esperan un paso del equipo |
| A Facturar / Falta Pago | Cantidad de servicios en esos estados |
| Estancados | Servicios demorados más de lo normal para ese cliente, sin facturar o sin cobrar |
| Por Cobrar Vencido | Lo facturado que ya pasó el plazo de pago del cliente |
| Próximos Servicios (7 días) | Agenda de la semana |
| Mis Pendientes | Tareas de los servicios que tenés que hacer |
| Servicios Estancados | Detalle de cada servicio demorado y cuántos días lleva |
| Registro de Auditoría | Sólo ADMIN: quién cambió qué y los datos antes y después |

### Menú

| Opción | Para qué sirve |
| --- | --- |
| Inicio | Pantalla de inicio |
| Servicios › Creados, Pendientes, Env. Detalles, A Facturar, Pendiente Pago, Pagados, Cancelados | Lista de servicios filtrada por estado, cada una con lo que hay que hacer en ese paso |
| Servicios › General | Todos los servicios y el calendario |
| Gastos | Gastos de la empresa, de autos y de choferes |
| Clientes | Datos y tarifas de cada cliente |
| Choferes › Listado/Config, Adelantos, Liquidaciones | Datos de choferes, dinero adelantado y pagos |
| Autos | Vehículos |
| Vencimientos | Seguros, VTV, carnets y otros documentos |
| Estadísticas | Indicadores (ADMIN y DIRECTOR) |
| Encuestas | Respuestas de satisfacción de clientes (ADMIN y DIRECTOR) |
| Usuarios | Alta y bloqueo de usuarios (ADMIN y DIRECTOR) |
| Inteligencia Artificial › Asistente | Chat con el asistente |
| Inteligencia Artificial › Preguntas sin resolver | Lo que el asistente no supo responder (ADMIN y DIRECTOR) |

## 4. Cargar un servicio

Un servicio se carga desde cualquier lista de Servicios con "Nuevo Servicio". El sistema calcula solo el importe al cliente y el pago al chofer con la tarifa elegida.

### Paso a paso

1. Andá a Servicios › General (o cualquier lista de servicios) y tocá "Nuevo Servicio".
2. Completá "Fecha Inicio" y "Fecha Fin".
3. Elegí el "Tipo de Servicio" y el "Tipo de Facturación": factura A, monotributo o informal (sin factura).
4. En "Tarifa a Aplicar" elegí la tarifa: carga los precios por km y por hora del cliente y del chofer. Podés ajustarlos a mano en "Precios Cliente" y "Precios Chofer".
5. Elegí el cliente en "Clientes", el chofer en "Choferes" (uno solo por servicio) y el auto en "Autos".
6. Completá "Origen" y "Destino". Si el cliente pidió un tipo de auto, indicalo en "Tipo de Vehículo (para Voucher)".
7. Cargá "KM Recorridos", "KM Extra (Cliente)" y "Horas de Espera". Si a partir de la sexta hora de espera se cobra doble, marcá "¿Recargo 5+ Hs? (Vale doble)".
8. Revisá el IVA en "% de IVA a aplicar": los servicios nuevos arrancan en 10,5%; cambialo a 21% si corresponde. Marcá "¿Es IVA Exento?" si el servicio no lleva IVA. Si hay descuento, cargalo en "Descuento (%)".
9. Agregá "Detalles Adicionales" y, si querés que el cliente las vea en el reporte, notas en "Comentarios (Visibles en el Reporte PDF)".
10. Tocá "Guardar".

### Tipos de servicio

| Tipo | Cuándo se usa |
| --- | --- |
| Servicio | Viaje con un auto de LECMA (propio o de terceros) para un cliente de LECMA. |
| Conducción | El chofer maneja el auto del cliente o uno que el cliente propone. |
| Mediavuelta | Viaje para un cliente de un colega, que nos pasa la media vuelta porque combina con un viaje nuestro. |
| Mensajería | Envío de un paquete. |
| Otro | Casos especiales que no entran en los anteriores. |

El resumen del formulario muestra el neto, el IVA y el total al cliente, y el monto para el chofer, mientras cargás.

### Servicios tipo "Otro"

Para trabajos con precio cerrado, elegí el tipo "Otro": en lugar de km y horas se cargan "Monto Final Acordado (Cliente)" y "Monto Final (Chofer)", que son montos fijos.

### Estado inicial

Si falta algún dato obligatorio (cliente, fechas, origen, destino, chofer, auto o un total mayor que cero), el servicio queda en Creado. Al completarlo pasa solo a Pendiente.

### Opciones al guardar

- **Crear Vuelta:** genera automáticamente el viaje de regreso, con origen y destino invertidos.
- **Programación Masiva (Días Múltiples):** crea copias del mismo viaje en las fechas que agregues con "Agregar". Podés repetir un día para crear varios servicios iguales.

### Dentro del servicio

- **"Agregar Gasto":** gastos del viaje (combustible, peajes, estacionamiento…). Ver sección 9.
- **"Agregar Reembolso":** gastos que se le recobran al cliente, con foto o PDF en "Evidencias (Opcional)".
- **"Agregar Pendiente":** tareas para recordar (por ejemplo, confirmar el horario con el pasajero). Con "Avisar día antes / mismo día" el sistema envía un recordatorio por correo.
- **"Generar Encuesta":** crea el enlace de la encuesta de satisfacción del servicio (sección 15).

## 5. Trabajar con la lista de servicios

Cada opción de Servicios muestra los servicios de un estado. Lo habitual es trabajar en orden: lo que está en Pendientes se avanza, lo que está en Env. Detalles se agrupa en reportes, lo de A Facturar se factura y lo de Pendiente Pago se cobra.

### Buscar y filtrar

- **"Buscar..."** busca en todas las columnas a la vez.
- Cada columna (fecha, trayecto, cliente, chofer…) tiene su propio filtro en el ícono del embudo.
- **"Limpiar Filtros"** se pone de color cuando hay filtros activos; tocalo para sacarlos todos.
- En General, Pagados y Cancelados, el selector de período elige qué servicios traer: últimos 3 meses (lo que se ve al entrar), 6 meses, último año o todo. Si buscás un servicio viejo y no aparece, elegí "Todo".
- **Agrupado / Desagrupado** muestra los servicios juntos bajo su reporte o como lista simple.
- El **calendario** (ícono de calendario arriba) muestra los servicios por día.

### El calendario

Muestra los servicios de cada día. Se puede ver por mes o por semana: se cambia con los botones de arriba a la derecha. El color de cada servicio indica en qué estado está:

| Color | Estado |
| --- | --- |
| Gris | Creado |
| Amarillo | Pendiente |
| Azul | Pendiente de enviar detalles |
| Violeta | Pendiente de facturar |
| Rojo | Pendiente de pago |
| Verde | Pagado |
| Punto naranja | El servicio tiene algún pendiente |

### Botones de cada servicio

| Botón | Qué hace |
| --- | --- |
| Flecha verde | Avanza el servicio al paso siguiente. El texto de ayuda dice a qué estado pasa |
| Lápiz | Abre el servicio para ver o editar todos sus datos |
| Reloj | Muestra el historial de estados: cuándo cambió, de qué a qué y quién lo hizo |
| PDF azul | Abre el reporte al que pertenece el servicio |
| Tacho rojo | Borra el servicio (pide confirmación) |

La flecha no aparece en Env. Detalles ni en A Facturar: esos pasos se hacen armando el reporte y facturando (secciones 6 y 7).

### En la vista agrupada

Cada reporte tiene una cabecera con su código, su estado, un lápiz para editar los comentarios del reporte y un reloj con el historial del reporte y de todos sus servicios. Según el estado del reporte aparece:

- **"Pendiente Pago"**, para pasar todo el reporte a pendiente de pago.
- **"Pagado"**, para registrar el cobro del reporte completo (sección 8).

### Selección múltiple

Con las casillas de la izquierda podés marcar varios servicios. Aparecen las acciones para la selección: "Generar Voucher", "Generar Encuesta" y, según la lista, "Ver Resumen" o "Facturar".

### Si un cambio de estado no te deja

El sistema sólo permite avanzar un paso por vez. Si un servicio quedó en un estado equivocado, pedile a un ADMIN que lo corrija: es el único rol que puede saltear pasos o volver atrás. El mensaje de error explica cuál es el paso que corresponde.

## 6. Enviar detalles y armar un reporte

Un reporte junta los servicios de un cliente en un PDF para enviarle el detalle y después facturarlo. Se arma desde Servicios › Env. Detalles.

1. Andá a Servicios › Env. Detalles.
2. Marcá con las casillas los servicios del mismo cliente que van en el reporte.
3. Tocá "Ver Resumen": muestra la lista elegida con el subtotal, el IVA y el total.
4. Si querés, escribí comentarios para el cliente; salen en el PDF.
5. Tocá "Generar Reporte". El reporte recibe su código (por ejemplo REP-0042) y se genera el PDF.
6. Abrí el PDF con el ícono azul de cualquiera de sus servicios y enviáselo al cliente.

Después de armarlo, los servicios a facturar pasan a A Facturar y los informales a Pendiente Pago.

### El sistema no deja armar el reporte si…

- Hay servicios de distintos clientes.
- Algún servicio ya está en otro reporte.
- Algún servicio está pagado, cancelado o todavía en Creado.

El mensaje indica qué servicio es el problema. Si mezclás servicios a facturar con informales, el sistema pide que confirmes, porque suele ser un error de selección.

### Corregir un reporte

- Los comentarios del reporte se editan con el lápiz de su cabecera en la vista agrupada; el PDF se vuelve a generar.
- Si editás un servicio del reporte, el PDF se actualiza solo.

## 7. Facturar

La factura se emite fuera del sistema (en AFIP o el sistema de facturación que uses); en el sistema se registra su número y se eligen los reportes que cubre.

### Registrar una factura

1. Andá a Servicios › A Facturar y tocá "Facturar".
2. En "Cliente a Facturar" elegí el cliente. Aparecen sus reportes listos para facturar, con código, cantidad de viajes y total estimado.
3. Escribí el "Número de Factura" que emitiste. Es obligatorio y no se puede repetir.
4. Marcá los reportes que incluye esa factura.
5. Tocá "Confirmar Factura".

Los servicios facturados pasan a Pendiente Pago. Los servicios cancelados de esos reportes no se facturan ni suman al total.

### Corregir un número de factura

1. En la lista de servicios, tocá el lápiz al lado del número de factura.
2. Escribí el "Nuevo Número de Factura".
3. En "Servicios a incluir en esta factura", dejá marcados los servicios a los que les cambia el número. Si desmarcás algunos, la factura se divide en dos: los marcados pasan al número nuevo y los demás quedan con el anterior, y los totales de ambas se recalculan.
4. Guardá.

### Atención

- Un servicio que ya tiene factura no se puede volver a facturar.
- Si editás los importes de un servicio ya facturado, la factura registrada no se actualiza: avisá al administrador para corregirla.
- Las facturas deben guardarse en las carpetas compartidas de la empresa.

## 8. Registrar cobros

Cuando el cliente paga, se marca como Pagado el reporte entero o cada servicio por separado. El reporte pasa a Pagado recién cuando todos sus servicios están pagados.

### Cobro de un reporte completo

1. Andá a Servicios › Pendiente Pago, en vista Agrupado.
2. En la cabecera del reporte cobrado, tocá "Pagado".

Todos sus servicios pasan a Pagado, salvo los cancelados.

### Cobro de un servicio suelto

Si el cliente pagó sólo parte de un reporte, tocá la flecha verde de cada servicio cobrado. El reporte sigue en Pendiente Pago hasta que se pague el último.

### Si el botón "Pagado" no aparece

El botón aparece sólo cuando el reporte está en Pendiente Pago. Si el reporte todavía figura como A Facturar o Generado, primero tocá "Pendiente Pago" en su cabecera o facturalo (sección 7).

### Para tener en cuenta

El sistema registra que el servicio se cobró y cuándo se marcó, pero no el medio de pago ni el monto recibido.

## 9. Gastos y reintegros

Los gastos se cargan en dos lugares: los de un viaje, dentro del servicio, y los generales (de un auto, de un chofer o de la empresa), en la pantalla Gastos. Un reintegro es un gasto que se le cobra al cliente.

### Tipos de gasto

Estos son los tipos que se pueden elegir en el campo "Tipo":

| Tipo | Qué incluye | Se asigna a |
| --- | --- | --- |
| Combustible | Carga de nafta o gasoil. | Auto (obligatorio); servicio si fue durante un viaje |
| Peaje | Peajes pagados en un traslado. | Empresa |
| Lavados | Lavado de una unidad. | Auto |
| Viáticos | Comidas y gastos del chofer durante un viaje. | Servicio si es de un viaje |
| Mantenimiento | Service, reparaciones, repuestos y cubiertas. | Auto |
| Seguros | Seguro de la unidad. | Auto |
| Strix | Abono del rastreo satelital Strix. | Auto |
| Starlink | Abono del servicio de internet Starlink. | Auto |
| Mediavuelta | Abono del servicio Mediavuelta. | Servicio |
| Patentes | Impuesto automotor de la unidad. | Auto |
| Seguro accidentes personales | Cobertura de accidentes personales de un chofer. | Chofer |
| Ingresos brutos | Impuesto provincial sobre la facturación. | Empresa |
| Contadores | Honorarios del estudio contable. | Empresa |
| Régimen de autónomos | Aportes del régimen de autónomos. | Empresa |
| Cocheras | Guarda mensual de unidades o estacionamiento en un viaje. | Auto; servicio si fue durante un viaje |
| Movilidad | Traslados del personal fuera de la flota (taxi, remis, colectivo). | Servicio |
| Mantenimiento web | Hosting, dominio y mantenimiento de la web y el sistema. | Empresa |
| IVA | Pago de IVA. | Empresa |
| Ganancias | Impuesto a las ganancias. | Empresa |
| Sueldos | Sueldos y cargas sociales. | Administrativo (el del conductor es en la creación del servicio) |
| Otros (extraordinario) | Gastos puntuales que no entran en ningún otro tipo. Explicalos en "Descripción". | Según corresponda |

"Empresa" quiere decir que se carga en Gastos sin elegir vehículo ni chofer ni servicio.

Si necesitás un tipo de gasto que no está en la lista, pedile al encargado de sistemas que cree la nueva categoría. No lo cargues en otro tipo parecido.

### Gastos de un viaje

1. Abrí el servicio con el lápiz.
2. Tocá "Agregar Gasto", elegí el tipo (combustible, peaje, cocheras…) y cargá el monto.
3. Si lo pagó el chofer de su bolsillo, marcá "Abonado por el chofer (Reembolsable)": se le devuelve en su liquidación.
4. Guardá el servicio.

### Gastos generales

1. Andá a Gastos y tocá "Nuevo Gasto".
2. Completá "Fecha", "Tipo", "Monto" y "Descripción".
3. Si corresponde, elegí "Vehículo (Opcional)" y "Chofer (Opcional)". Los gastos que se imputan al costo por km de un auto (combustible, por ejemplo) exigen elegir el vehículo.
4. Tocá "Guardar".

### Reintegros al cliente

1. Dentro del servicio, tocá "Agregar Reembolso".
2. Escribí el concepto y el monto.
3. En "Evidencias (Opcional)" adjuntá la foto o el PDF del comprobante. Se pueden subir varios archivos de hasta 5 MB cada uno.
4. Guardá el servicio. Para ver un comprobante, tocá "Evidencia 1", "Evidencia 2", etc.

### Límites

Un gasto que pertenece a una liquidación ya pagada no puede cambiar de monto.

## 10. Liquidar a un chofer y registrar adelantos

La liquidación calcula cuánto se le paga a un chofer: sus viajes, menos los adelantos que recibió, más los gastos que pagó de su bolsillo. Una vez pagada, queda cerrada.

### Registrar un adelanto

1. Andá a Choferes › Adelantos y tocá "Nuevo Adelanto".
2. Elegí el chofer y completá fecha, monto y una nota.
3. Tocá "Guardar". Queda pendiente de descontar en su próxima liquidación.

### Armar una liquidación

1. Andá a Choferes › Liquidaciones y tocá "Nueva Liquidación".
2. En "Seleccionar Chofer" elegí el chofer y cargá el "Rango de Fechas (Para registro)".
3. El sistema trae lo pendiente de ese chofer en tres listas: "Servicios (Viajes)", "Adelantos a Descontar" y "Gastos del Chofer a Reembolsar (Pendientes)". Marcá lo que corresponde a esta liquidación.
4. Si hace falta, agregá un gasto puntual en "Gastos (A Reembolsar)" con "Agregar".
5. Revisá el total y escribí las "Observaciones (Para el reporte)" si las hay.
6. Tocá "Generar Liquidación". Recibe un código (LIQ-fecha-número).

### Después de generarla

- **"Imprimir PDF"** genera el comprobante para el chofer.
- **"Editar"** permite corregirla mientras no esté pagada; al terminar, "Guardar Cambios".
- **"Registrar Pago"** la marca como pagada. Desde ese momento no se puede editar, ni tampoco sus adelantos ni el monto de sus gastos.

Si el total da negativo (el chofer recibió más adelantos que lo que le corresponde), al registrar el pago la diferencia queda como un adelanto nuevo, que se descuenta en la siguiente liquidación.

### Antes de liquidar, revisá

- Que los viajes elegidos no estén en otra liquidación: el sistema todavía no lo controla.
- Que no se liquiden servicios futuros: sólo los realizados hasta el día de la liquidación.
- Que el total coincida con lo que vas a pagar.

## 11. Clientes, choferes, autos y tarifas

Estas pantallas guardan los datos que se usan al cargar servicios. Todas funcionan igual: "Nuevo" para dar de alta, el lápiz para editar, "Guardar" para confirmar.

### Clientes

| Campo | Para qué sirve |
| --- | --- |
| Nombre, CUIT, Dirección, Teléfono, Email | Datos del cliente. El CUIT no se puede repetir |
| Precio KM Default, Precio KM Extra Default y precio por hora | Tarifa propia del cliente, que se copia a cada servicio nuevo |
| Enviar detalles | Marcalo si el cliente pide el detalle de los viajes antes de facturar: sus servicios pasan por Env. Detalles |
| Enviar facturas | Marcalo si al cliente se le factura |
| Días normales hasta facturar / hasta que paga | Con estos plazos el sistema detecta servicios estancados o cobros vencidos |
| Notas | Información interna |

El ícono "Ver estadísticas" abre el detalle del cliente (sólo ADMIN y DIRECTOR).

> **En desarrollo:** se le pidió al encargado de sistemas que la pantalla Clientes muestre la categoría de cada cliente y sume un tracker de referidos.

### Choferes

Nombre, teléfono, email, CUIT y número de licencia. La fecha de vencimiento del "Carnet de conducir" crea el vencimiento correspondiente (sección 12).

### Autos

- Patente (no se puede repetir), modelo y propiedad: propio o de terceros.
- Para autos propios, "Precio de compra" y "Fecha de compra" permiten ver cuándo recupera la inversión en "Ver rentabilidad".
- Las fechas de "Seguro", "VTV" y "Ruta / Habilitación" crean los vencimientos del auto.

### Tarifas (ADMIN y DIRECTOR)

Se administran desde "Configuración", en la lista de servicios.

1. Cada tarifa tiene un "Nombre de Tarifa" y precios por km, por hora y por km extra para el cliente, y por km y por hora para el chofer.
2. "Marcar como Favorita Predeterminada" hace que se proponga primero al cargar servicios.
3. El ajuste masivo aumenta todas las tarifas a la vez con un porcentaje por concepto ("KM (%)", "Hora (%)", "KM Ext. (%)" y los del chofer).

Cambiar una tarifa no modifica los servicios ya cargados: cada servicio guarda los precios del momento en que se cargó.

### Antes de borrar

No borres un cliente, chofer o auto que tenga servicios: los servicios quedarían sin él. El sistema sólo lo impide si tiene reportes o liquidaciones.

## 12. Vencimientos y recordatorios

El sistema avisa por correo antes de que venzan seguros, VTV, carnets y otros documentos, y recuerda las tareas de cada servicio.

### Cargar un vencimiento

1. Andá a Vencimientos y tocá "Nuevo Vencimiento".
2. Elegí el "Tipo" y la "Fecha de vencimiento".
3. Asocialo a un "Vehículo (opcional)" o a un "Chofer (opcional)".
4. En "Avisar con cuántos días de anticipación" indicá desde cuándo avisar (30 días, si no lo cambiás).
5. Tocá "Guardar".

Los vencimientos de seguro, VTV y habilitación de autos, y de carnet de choferes, también se cargan desde la ficha del auto o del chofer.

### Renovar

Cuando se renueva un documento, editá el vencimiento y poné la fecha nueva. El cambio queda en el historial: "Ver historial de este vencimiento" o "Ver historial completo".

### Avisos automáticos

| Aviso | Cuándo llega |
| --- | --- |
| Vencimientos próximos | Todas las mañanas, para los documentos dentro de su plazo de aviso |
| Tareas de servicios de mañana y de hoy | Todas las mañanas, para las tareas con "Avisar día antes / mismo día" |
| Recordatorio con hora | A la hora elegida en la tarea |
| Resumen del mes | El día 1 de cada mes |

Las tareas pendientes de todos los servicios también aparecen en "Mis Pendientes" de la pantalla de inicio.

## 13. Estadísticas

La pantalla Estadísticas (ADMIN y DIRECTOR) muestra cuánto se facturó, cuánto se gastó y cuánto quedó, con filtros por año, mes, tipo de servicio y auto. Todo se puede bajar con el botón "Excel".

| Bloque | Qué muestra |
| --- | --- |
| Ganancias, Gastos Totales, Ganancia Neta, Margen de Ganancia | Resultado del período, después de pagar choferes y gastos |
| Impuestos (IVA) | IVA facturado en el período |
| Dinero en la Calle / Atención: Cuentas por Cobrar | Lo facturado que todavía no se cobró |
| Facturación por KM y Costo Operativo por KM | Cuánto entra y cuánto cuesta cada kilómetro |
| Top Clientes | Clientes que más facturan |
| Rendimiento de Choferes | Viajes y montos por chofer |
| Ranking Vehículos | Rentabilidad de cada auto |
| Tipos de Servicio | Distribución por tipo |
| Resumen de Gastos | Gastos por tipo |

### Más detalle

- **Un cliente:** en Clientes, el ícono "Ver estadísticas".
- **Un auto:** en Autos, el ícono "Ver rentabilidad". Para autos propios con precio de compra, muestra cuándo se recupera la inversión.

### Cómo leer los números

- El margen de un servicio es su total menos el pago al chofer menos sus gastos.
- Los servicios cancelados no se cuentan.
- Un viaje del último día del mes después de las 21 h puede aparecer en el mes siguiente, porque el sistema agrupa los meses en hora UTC.

Para preguntas que estas pantallas no responden, usá el asistente de IA (sección 14).

## 14. Usar el asistente de IA

El asistente es un chat al que le podés preguntar en lenguaje común por los datos del sistema, pasarle órdenes de compra para identificarlas y pedirle cambios. Los cambios nunca se hacen solos: te muestra la propuesta y vos tocás "Confirmar".

### Hacer una consulta

1. Andá a Inteligencia Artificial › Asistente.
2. Escribí la pregunta y tocá "Enviar" (o Enter).
3. Mientras trabaja muestra lo que está haciendo ("Consultando los datos…"). Las respuestas largas vienen como tabla, con botón "Excel" para descargarla, o como gráfico.

El asistente recuerda la conversación: podés seguir con "y en septiembre?" o "pasá el segundo a pagado".

### Ejemplos

| Para | Preguntá algo como |
| --- | --- |
| Buscar | "Servicios de Sidersa en agosto que todavía no se facturaron" |
| Filtrar a medida | "Viajes con más de 3 horas de espera este mes, por chofer" |
| Gastos | "¿Cuánto gastamos en combustible por auto en septiembre? Mostralo en un gráfico" |
| Cobranzas | "¿Qué clientes nos deben facturas de hace más de 60 días?" |
| Comparar | "Margen por cliente este trimestre contra el anterior" |
| Historial | "¿Cuándo se pagó el REP-0123 y quién lo marcó?" |
| Vencimientos | "¿Qué seguros vencen en los próximos 30 días?" |

Las preguntas de análisis financiero (márgenes, facturación total, rankings) están disponibles para ADMIN y DIRECTOR.

### Identificar órdenes de compra

1. Tocá el clip y adjuntá la orden en PDF o foto. Podés adjuntar hasta 5 archivos a la vez.
2. Escribí algo como "¿A qué servicio corresponde cada una?" y enviá.
3. Para cada orden te muestra el servicio más probable, con su reporte, su factura y por qué lo eligió (importe, cliente, fecha, trayecto). Si dos servicios quedan parejos, te dice qué dato falta para decidir.

### Pedir cambios

Podés pedirle que cree un servicio (por ejemplo, pegando el mail del cliente), que edite datos de uno o que le cambie el estado.

1. El asistente arma la propuesta y la muestra en una tarjeta con lo que va a hacer.
2. Revisala y tocá "Confirmar" para hacerlo o "Cancelar" para descartarlo.
3. La tarjeta pasa a "Hecho", "Cancelado" o "Falló", con el motivo.

El asistente aplica las mismas reglas que la pantalla: no saltea estados (salvo ADMIN) y no cambia km, horas ni chofer de un servicio ya facturado o liquidado. Los servicios que crea quedan en Creado para que los completes en el formulario.

### Conversaciones

- "Nueva conversación" empieza de cero; conviene usarla al cambiar de tema.
- "Conversaciones anteriores" vuelve a abrir una charla, con sus tablas y propuestas.
- El tacho borra la conversación abierta. Cada usuario ve sólo las suyas.
- "Ver cómo lo resolvió" muestra las consultas que hizo, para verificar de dónde salen los números.

Si el asistente no puede responder algo, lo registra para que el equipo lo revise en Preguntas sin resolver.

## 15. Encuestas de satisfacción y vouchers

### Enviar una encuesta

1. En la lista de servicios marcá uno o varios servicios del mismo cliente, o abrí un servicio.
2. Tocá "Generar Encuesta".
3. Copiá el enlace y compartilo con el cliente por WhatsApp o mail. Es único para ese servicio y se responde una sola vez.

El cliente lo abre sin usuario ni contraseña y responde cómo estuvo el viaje, qué tan probable es que recomiende LECMA y qué se podría mejorar.

### Ver los resultados (ADMIN y DIRECTOR)

En Encuestas se ven el promedio general, el promedio por chofer, el NPS (índice de recomendación), el ranking de choferes y de clientes, y cada respuesta con sus comentarios. Sólo un ADMIN puede borrar una respuesta.

### Generar un voucher

El voucher es el comprobante del viaje para el pasajero.

1. Marcá los servicios en la lista; tienen que ser del mismo cliente.
2. Tocá "Generar Voucher". Se descarga el PDF.

El voucher muestra el tipo de auto indicado en "Tipo de Vehículo (para Voucher)" del servicio.

## 16. Administrar usuarios (ADMIN y DIRECTOR)

Cada persona tiene que tener su propio usuario: así el sistema registra quién hizo cada cambio.

### Dar de alta un usuario

1. Andá a Usuarios y tocá "Nuevo usuario".
2. Completá "Nombre", "Email" y "Contraseña".
3. Elegí el "Rol" (sección 1).
4. Tocá "Guardar" y pasale el correo y la contraseña por un medio privado.

Usá una contraseña larga y única: el sistema todavía no exige un mínimo.

### Cambiar contraseña, rol o bloquear

1. Tocá el lápiz del usuario.
2. Para cambiar la contraseña, escribila en "Nueva contraseña (opcional)"; si lo dejás vacío, no cambia.
3. Para desbloquearlo o bloquearlo, usá "Usuario bloqueado".
4. Tocá "Guardar".

Los usuarios no se borran: cuando alguien deja la empresa, bloquealo. Un usuario bloqueado no puede entrar, aunque tenga una sesión abierta.

### Reglas

- Sólo un ADMIN puede crear otro ADMIN o darle ese rol a alguien.
- Un DIRECTOR no puede modificar a un ADMIN.
- La columna "Último acceso" muestra cuándo entró cada uno por última vez; sirve para detectar usuarios que ya no se usan.

## 17. Preguntas frecuentes

| Pregunta o mensaje | Respuesta |
| --- | --- |
| No encuentro un servicio viejo en General o Pagados | Cambiá el período a "Todo": por defecto se muestran los últimos 3 meses |
| El servicio no tiene la flecha para avanzar | En Env. Detalles y A Facturar se avanza armando el reporte o facturando; en Pagado y Cancelado ya no hay pasos |
| "No tenés permisos para forzar un cambio de estado" | Quisiste saltear un paso. El mensaje dice cuál corresponde; si hay que corregir el estado, pedíselo a un ADMIN |
| No aparece el botón "Pagado" en el reporte | El reporte todavía no está en Pendiente Pago: facturalo o tocá "Pendiente Pago" primero |
| "No se puede armar el reporte" | Revisá que todos los servicios sean del mismo cliente, no estén en otro reporte y no estén pagados, cancelados ni en Creado |
| "Un servicio puede tener un solo chofer" | Dejá un único chofer; si fueron dos, cargá un servicio para cada uno |
| El servicio queda en Creado | Falta un dato obligatorio: cliente, fechas, origen, destino, chofer, auto o un total mayor que cero |
| Edité un servicio ya facturado | La factura registrada no cambia: avisá al administrador |
| "Hay servicios que ya están facturados" | Esos servicios ya tienen factura; para cambiarles el número usá el lápiz del número de factura |
| El PDF no se abre | Permití las ventanas emergentes del sitio en el navegador y probá de nuevo |
| "Tu sesión venció" | Volvé a ingresar la contraseña; lo que estabas haciendo se completa |
| El asistente dio un número raro | Abrí "Ver cómo lo resolvió" para ver la consulta que hizo, y repreguntá aclarando el período o el filtro |

Si algo no está en este manual o un error se repite, avisá al administrador del sistema con el mensaje exacto y el servicio o reporte afectado.
