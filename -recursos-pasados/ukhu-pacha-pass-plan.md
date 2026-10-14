# Ukhu Pacha Pass: plan de especificación y desarrollo

Sistema web de registro, control de pagos y acceso con QR para la fiesta de Halloween del sábado 31 de octubre de 2026 (Santa María, Cusco). Documento pensado para ser entregado a Claude Code como guía de construcción.

---

## 1. Resumen ejecutivo

**Problema real:** una fiesta de 200 a 250 personas necesita cobrar entradas de 20 soles, saber quién pagó y controlar el ingreso sin colados ni entradas repetidas, con un Excel que hoy se desordena fácil.

**Solución:** una aplicación web simple donde:

1. Los interesados se registran (DNI, nombre, correo, celular) y quedan en estado "pendiente de pago".
2. Los coordinadores reciben el pago por Yape, Plin o efectivo y lo marcan en el sistema.
3. Solo a los pagados se les envía un QR único por correo, junto con un código corto de respaldo.
4. En la puerta, los guardias y los admins escanean el QR desde el celular, protegidos con un PIN compartido.
5. Un panel muestra pagados, ingresados, dinero recaudado y gastos.

**Objetivos secundarios:** que el equipo practique un sistema completo (base de datos, autenticación, correo, QR, escáner) con costo casi cero.

**Alcance fuera de esta versión:** pasarela de pago, subida de capturas de Yape, app móvil nativa, venta pública abierta.

---

## 2. Decisiones ya tomadas

| Tema | Decisión |
|---|---|
| Nombre | Ukhu Pacha Pass |
| Datos que se piden | DNI, nombre, correo, celular |
| Identificador único | DNI |
| Pagos | Se cobran a los coordinadores. No hay subida de capturas. Un admin marca "pagado" |
| Estados | Pendiente de pago, Pagado, Ingresado, Cancelado |
| Administradores | 5 personas, cada una con su usuario |
| Puerta | 2 puntos de ingreso. PIN compartido para guardias. Los admins también pueden escanear |
| Respaldo del QR | Código corto de 6 caracteres por persona, y búsqueda por DNI |
| Correo | Envío en lotes, varios días |
| Registro en puerta | El sistema debe permitir registrar y cobrar a alguien en el momento |
| Respaldo general | Los Excel que ya llevan los coordinadores, más una exportación CSV del sistema |
| Base de datos | Gratuita |
| Interfaz | Simple, limpia, ambiente Halloween con identidad cusqueña |

---

## 3. Alertas y decisiones pendientes

Estas son cosas que hay que resolver o tener presentes. Claude Code debe dejarlas configurables cuando sea posible.

1. **Menores de edad y alcohol.** Si asisten menores de 18, el alcohol no puede entregárseles y la responsabilidad recae en los organizadores. El DNI no indica edad. Decisión pendiente: agregar un campo opcional de fecha de nacimiento, o una casilla "confirmo que soy mayor de 18 o asisto con autorización", y definir una pulsera o sello distinto para menores. **Valor por defecto del plan:** agregar la casilla de mayoría de edad y un campo `es_menor` editable por admin, para que los guardias vean un aviso al escanear.
2. **Quién registra en la puerta.** Si los guardias pudieran marcar pagos, habría riesgo de errores o fraude. **Valor por defecto:** solo un usuario admin puede crear registros en puerta o marcar pagos. El guardia ve el aviso "Llamar a un admin".
3. **Datos personales.** Se guardan DNI, correo y celular. Pedir solo lo necesario, mostrar un texto de consentimiento breve en el formulario y **borrar o anonimizar los datos después de la fiesta** (hay un comando previsto en la fase 8). Nunca mostrar el DNI completo en pantallas públicas.
4. **Permisos y aforo.** Conviene consultar con la municipalidad y revisar con el dueño de la casa el aforo, el alcohol y el ruido, aunque la casa esté alejada. No es parte del sistema, pero afecta la fiesta.
5. **Cuota gratuita de servicios.** Los límites cambian con el tiempo. Antes de empezar, verificar los planes gratuitos vigentes de Supabase, Vercel y Gmail (ver sección 6).
6. **Base de datos gratuita que se pausa.** El plan gratuito de Supabase pausa proyectos tras un tiempo de inactividad. Mantener el proyecto activo durante las semanas previas y verificarlo el día anterior al evento.
7. **Señal en la puerta.** Se dijo que la señal es buena. Igual se prueba en el lugar antes del evento y se lleva el respaldo impreso o en Excel.

---

## 4. Usuarios y roles

| Rol | Cómo entra | Qué puede hacer |
|---|---|---|
| Público | Sin cuenta | Ver la página de inicio, llenar el formulario de registro, ver su entrada con QR mediante el enlace del correo |
| Guardia | PIN compartido | Escanear QR, buscar por código corto o DNI, ver resultado de ingreso |
| Admin (5) | Correo y contraseña | Todo lo anterior, más lista completa, marcar pagos, registro manual y cobro en puerta, enviar QR, corregir datos, panel, gastos, exportar |

---

## 5. Requerimientos

### 5.1 Funcionales

**Registro público**
- Formulario con DNI (8 dígitos), nombre completo, correo, celular y casilla de consentimiento y mayoría de edad.
- Validación de formato en cliente y servidor. DNI duplicado devuelve un mensaje claro ("Ya estás registrado") sin revelar los datos de quien lo hizo.
- Al registrarse, el estado inicial es "pendiente de pago". Se muestra una pantalla de confirmación con las instrucciones para pagar a los coordinadores.
- Protección básica contra spam: campo trampa (honeypot) y límite de intentos por IP.

**Panel de administración**
- Inicio de sesión de admin.
- Lista de asistentes con búsqueda (nombre, DNI, correo, celular, código corto) y filtros por estado.
- Acción para marcar "pagado" (con monto, por defecto el precio de la entrada, y quién lo marcó y cuándo).
- Acción para revertir un pago o cancelar un registro (con registro del cambio).
- Edición de datos de un asistente.
- Registro manual de un asistente nuevo, con opción de dejarlo directamente como pagado.
- Envío de QR por lotes: selección de pagados sin envío, botón "Enviar QR" con tope por lote, y reintento de los fallidos.
- Reenvío individual del QR.
- Exportación CSV de toda la lista y de pagados.
- Panel de resumen: registrados, pendientes, pagados, ingresados, recaudado, aforo y porcentaje de ingreso.
- Control simple de gastos (concepto y monto) con balance: recaudado menos gastos, y entradas necesarias para el punto de equilibrio.
- Configuración mínima: precio de entrada y aforo.

**QR y entrada**
- Cada asistente pagado tiene un token aleatorio e impredecible (no el DNI).
- El QR contiene solo el token con un prefijo (por ejemplo `UPP:<token>`), no una URL. Así, la cámara normal del celular no abre ni marca nada.
- Código corto de 6 caracteres, sin caracteres ambiguos (sin 0, O, 1, I, L), único.
- Página pública `/entrada/[token]` que muestra el QR y el código corto, de solo lectura, útil para compartir por WhatsApp.
- Correo con el QR incrustado, el código corto y datos de la fiesta.

**Puerta (escáner)**
- Acceso con PIN compartido. Los admins logueados entran sin PIN.
- Pantalla de escáner con la cámara trasera, optimizada para celular, con lectura continua.
- Entrada manual de código corto o DNI cuando el QR falla.
- Resultados claros a pantalla completa:
  - **Válido:** nombre, código y hora, con confirmación de ingreso.
  - **Ya ingresó:** nombre y hora del primer ingreso, quién lo escaneó.
  - **No pagado o pendiente:** aviso para derivar a un admin.
  - **Cancelado o no encontrado.**
  - **Aviso de menor:** si el asistente está marcado como menor.
- El ingreso se marca de forma atómica: dos celulares escaneando el mismo QR al mismo tiempo no pueden registrar dos ingresos.
- Contador visible de ingresados.
- Registro de cada escaneo (éxito o rechazo) para auditoría.

**Ambiente y experiencia**
- Página de inicio con información de la fiesta (fecha, hora, precio, cómo pagar, aviso de edad).
- Toda la interfaz en español.

### 5.2 No funcionales

- **Simplicidad:** pocas pantallas, sin funciones que no se usen el día del evento.
- **Rendimiento:** el resultado de un escaneo debe verse en menos de 2 segundos con señal normal.
- **Móvil primero:** todo debe usarse cómodamente en celular. El panel admin también funciona en computadora.
- **Seguridad:** ver sección 9.
- **Confiabilidad:** si falla el internet en la puerta, se usa el respaldo (lista exportada). Los exports deben poder descargarse con un solo clic.
- **Accesibilidad:** contraste suficiente, botones grandes en la puerta, textos legibles.
- **Costo:** idealmente 0 soles. Un dominio propio es opcional.

---

## 6. Stack tecnológico

### 6.1 Recomendación

| Capa | Elección | Por qué |
|---|---|---|
| Frontend y backend | **Next.js (App Router) con TypeScript** | Ya lo conoces. Una sola base de código, rutas de servidor para la lógica sensible |
| Estilos | **Tailwind CSS** con variables de diseño propias | Rápido para construir una identidad consistente |
| Base de datos | **Supabase (PostgreSQL)**, plan gratuito | Base relacional real, panel para ver datos y soporta actualizaciones atómicas |
| Autenticación de admins | **Supabase Auth (correo y contraseña)** | Los 5 admins se crean a mano, sin registro público |
| Acceso de guardias | **PIN en variable de entorno + cookie firmada** | Simple, sin cuentas extra |
| Validación | **Zod** | Mismas reglas en cliente y servidor |
| Generación de QR | Librería `qrcode` | Genera imagen PNG o data URL en servidor |
| Lectura de QR | Librería de escáner por cámara (por ejemplo `html5-qrcode` o `@yudiel/react-qr-scanner`) | Funciona en el navegador del celular. Requiere HTTPS, que da el hosting |
| Correo | **Nodemailer con SMTP de una cuenta Gmail dedicada** (contraseña de aplicación) | Gratis y sin dominio. Cumple con el envío por lotes que aceptaste |
| Hosting | **Vercel** (plan gratuito) | Despliegue directo de Next.js con HTTPS |

### 6.2 Alternativas consideradas

- **Servicio de correo transaccional (por ejemplo Resend):** más profesional, pero sin dominio propio verificado solo permite enviar a tu propio correo. Si luego compran un dominio de bajo costo, es una buena mejora.
- **Firebase:** gratis y rápido, pero la base es de documentos y el control de actualizaciones atómicas y consultas de conteo es menos directo que en PostgreSQL.
- **SQLite o Turso:** muy simple, pero agrega piezas de despliegue y autenticación que Supabase ya resuelve.
- **Google Sheets como base de datos:** lo más fácil de tocar, pero no es confiable para evitar doble ingreso con dos celulares escaneando a la vez.

### 6.3 Notas sobre límites gratuitos (verificar antes de empezar)

- Gmail con cuenta personal permite un número limitado de correos por día (del orden de cientos). Por eso se programa envío en lotes. Usar una cuenta dedicada del evento, con verificación en dos pasos y contraseña de aplicación.
- Supabase gratuito: almacenamiento y conexiones suficientes para este volumen, pero pausa proyectos inactivos.
- Vercel gratuito: pensado para uso personal. Revisar los términos vigentes. La función serverless tiene límite de tiempo, así que el envío de correos se hace en lotes pequeños por solicitud.
- Los números exactos cambian. Confirmarlos en la documentación oficial de cada servicio.

---

## 7. Modelo de datos

### Tabla `attendees` (asistentes)

| Campo | Tipo | Nota |
|---|---|---|
| id | uuid, clave primaria | |
| dni | texto de 8 dígitos, único | Identificador único |
| nombre | texto | |
| correo | texto | |
| celular | texto | |
| estado | enum: `pendiente`, `pagado`, `ingresado`, `cancelado` | |
| es_menor | boolean, por defecto falso | Editable por admin |
| origen | enum: `web`, `admin`, `puerta` | |
| codigo_corto | texto de 6 caracteres, único | Se genera al marcar pagado |
| qr_token | texto aleatorio, único | Se genera al marcar pagado |
| monto_pagado | numeric | |
| pagado_en | timestamp | |
| pagado_por | uuid de admin | |
| correo_enviado_en | timestamp, nulo si falta | |
| ingresado_en | timestamp | |
| ingresado_por | texto (admin o "guardia") | |
| notas | texto | |
| creado_en | timestamp | |

### Tabla `scan_log` (auditoría de escaneos)

id, attendee_id (nulo si no se encontró), resultado (`valido`, `repetido`, `no_pagado`, `cancelado`, `no_encontrado`), metodo (`qr`, `codigo`, `dni`), dispositivo o usuario, fecha y hora.

### Tabla `payment_log` (historial de pagos)

id, attendee_id, accion (`marcar_pagado`, `revertir`, `cancelar`), monto, admin, fecha y hora.

### Tabla `expenses` (gastos)

id, concepto, monto, fecha, creado por.

### Tabla `settings` (configuración)

precio_entrada, aforo, nombre del evento, fecha. Una sola fila.

### Perfil de admin

Tabla `admin_profiles` enlazada a Supabase Auth con el nombre del admin, para registrar quién hizo cada acción.

**Reglas importantes**
- El marcado de ingreso es una sola instrucción atómica: actualizar a `ingresado` solo si el estado actual es `pagado`, y devolver la fila actualizada. Si no actualiza ninguna fila, se informa por qué.
- La seguridad de filas (RLS) queda activada y sin políticas públicas. Todo el acceso pasa por el servidor.

---

## 8. Flujos principales

**Registro:** persona llena formulario, servidor valida, crea registro en `pendiente`, muestra instrucciones de pago.

**Pago:** persona paga a un coordinador, el admin busca por DNI o nombre, marca pagado con monto, el sistema genera `qr_token` y `codigo_corto`, el registro pasa a `pagado`.

**Envío de QR:** el admin abre "Enviar QR", el sistema lista pagados sin envío, el admin envía un lote (por ejemplo 80 por vez), el sistema registra `correo_enviado_en` o el error, y el admin repite al día siguiente si hace falta.

**Ingreso:** el guardia abre `/puerta`, ingresa el PIN, escanea el QR, el servidor marca el ingreso de forma atómica y devuelve el resultado.

**Fallback sin QR:** el guardia escribe el código corto o el DNI, y se ejecuta el mismo proceso de validación.

**Pago en puerta:** un admin, con sesión iniciada, abre "Registro rápido", completa DNI, nombre, celular y correo (el correo puede ser opcional en este caso), marca pagado y opcionalmente marca ingreso inmediato.

---

## 9. Seguridad

- Las claves de servicio (`SUPABASE_SERVICE_ROLE_KEY`, contraseña de Gmail, PIN, secreto de sesión) solo en variables de entorno del servidor. Nunca en el cliente ni en el repositorio.
- El PIN de guardias se compara en el servidor, con límite de intentos fallidos por IP y bloqueo temporal.
- Cookies de sesión firmadas, `httpOnly`, `secure`, con vencimiento corto (por ejemplo hasta el final de la noche del evento).
- Los admins no tienen registro público. Se crean desde el panel de Supabase.
- El QR contiene un token aleatorio largo. No contiene datos personales.
- `/entrada/[token]` solo muestra el QR y el nombre, nunca el DNI completo.
- En pantallas de lista, enmascarar el DNI salvo en la vista de admin.
- Validar todo con Zod en el servidor. Consultas parametrizadas.
- Anti-spam en el formulario público: honeypot y límite por IP.
- Nunca registrar datos personales en logs de errores.

---

## 10. Pantallas y rutas

| Ruta | Acceso | Contenido |
|---|---|---|
| `/` | Público | Inicio con datos de la fiesta y botón de registro |
| `/registro` | Público | Formulario |
| `/registro/listo` | Público | Confirmación e instrucciones de pago |
| `/entrada/[token]` | Con el enlace | Muestra QR y código corto |
| `/admin/login` | Público | Inicio de sesión de admin |
| `/admin` | Admin | Panel de resumen |
| `/admin/asistentes` | Admin | Lista, búsqueda, filtros, acciones |
| `/admin/asistentes/nuevo` | Admin | Registro manual y rápido |
| `/admin/correos` | Admin | Envío de QR por lotes |
| `/admin/gastos` | Admin | Gastos y balance |
| `/puerta` | PIN o admin | Escáner y búsqueda manual |

---

## 11. Diseño visual

### 11.1 Concepto

Fiesta de Halloween con identidad cusqueña. Ukhu Pacha es el "mundo de adentro" en la cosmovisión andina, y la fecha coincide con la época de las ánimas y Todos los Santos. El tono es festivo, oscuro y con carácter, sin verse como una plantilla genérica.

### 11.2 Paleta simplificada

| Uso | Color |
|---|---|
| Fondo de página | `#0A0A0A` |
| Tarjetas | `#141414` |
| Bordes finos | `#1E1E1E` |
| Morado base (secciones, cabeceras, etiquetas de estado) | `#382054` |
| Morado oscuro (fondos de bloques destacados) | `#22123A` |
| Naranja (botón principal y acentos) | `#F7931E` |
| Amarillo (títulos principales y logo) | `#F2E94A` |
| Verde menta (válido, pagado, confirmaciones) | `#1FDB8A` |
| Rosa (errores, alertas, borde de botón secundario) | `#E8317F` |
| Texto principal | `#EDF3EF` |
| Texto sobre naranja, amarillo y menta | `#0A0A0A` |

Se descartan el verde lima y el morado claro para reducir ruido. Reglas de uso:

- Un solo color de acento dominante por pantalla.
- Amarillo solo para títulos y logo. Naranja solo para la acción principal.
- Menta significa "bien" y rosa significa "problema". No usarlos de forma decorativa.
- Sin degradados, sin brillos ni sombras difusas. Bordes de 1 px y esquinas poco redondeadas (4 px).

### 11.3 Estados

| Estado | Color de etiqueta |
|---|---|
| Pendiente | Naranja |
| Pagado | Menta |
| Ingresado | Morado base con texto claro |
| Cancelado | Gris sobre fondo oscuro |
| Error o alerta | Rosa |

### 11.4 Tipografía

- **IM Fell DW Pica:** títulos, botones y texto principal de la parte pública. Es la identidad del sitio. Usar tamaños generosos (cuerpo de al menos 18 px) porque es una fuente antigua que pierde legibilidad en tamaños pequeños.
- **Lora:** textos pequeños, tablas, formularios del panel y números (conteos, montos, códigos), por legibilidad.
- **Abraham Lincoln (de pago):** solo para el logo. Si no se compra la licencia, el logo se resuelve con IM Fell DW Pica y no se usa la fuente.
- Cargar las fuentes de Google Fonts con `next/font`.

### 11.5 Identidad cusqueña

- Motivo de la **chakana** (cruz andina escalonada) en SVG simple, para logo, separadores y favicon.
- **Franja escalonada** fina, inspirada en los diseños de los textiles, como borde decorativo.
- Silueta de **cerros (apus)** en morado oscuro al pie de la portada, con una luna delgada.
- Mostrar el nombre con subtítulo: "Ukhu Pacha, el mundo de adentro".
- Los textos de la página pública, cortos y con personalidad, sin frases genéricas. Si se usan palabras en quechua, que las revise una persona que lo hable.

### 11.6 Para que no parezca hecho por IA

- Sin emojis, sin íconos genéricos en cuadrículas de tres tarjetas, sin portada con degradado y frases vacías.
- Información real y concreta (fecha, hora, precio, cómo pagar).
- Pocas pantallas, mucho espacio, jerarquía clara.
- La pantalla de la puerta es funcional: botones enormes, resultado a pantalla completa en menta o rosa, sin adornos.

---

## 12. Orden de desarrollo

Hoy es martes 13 de octubre. La fiesta es el sábado 31. Se propone congelar el desarrollo el miércoles 28.

| Fase | Fechas | Qué se construye | Criterio de terminado |
|---|---|---|---|
| 0. Preparación | Mar 13 | Repositorio, proyecto Next.js, Supabase, variables de entorno, despliegue vacío en Vercel, cuenta Gmail dedicada | Página en blanco en una URL pública con HTTPS |
| 1. Registro público | Mié 14 a Vie 16 | Tema visual base, inicio, formulario, validación, tabla `attendees`, anti-spam | Se puede registrar gente y aparecen como pendientes. Se puede compartir el enlace |
| 2. Panel admin | Vie 16 a Dom 18 | Login de admin, lista, búsqueda, filtros, marcar pagado, revertir, edición, registro manual | Un admin marca pagos y los cambios quedan en el historial |
| 3. QR y correo | Lun 19 a Mié 21 | Generación de token y código corto, página `/entrada`, envío por lotes con Nodemailer | Un pagado recibe un correo con QR legible |
| 4. Escáner | Jue 22 a Vie 23 | `/puerta`, PIN, lectura por cámara, validación atómica, búsqueda manual, registro de escaneos | Dos celulares escaneando el mismo QR: solo uno ingresa |
| 5. Panel de resumen y gastos | Sáb 24 | Métricas, gastos, balance, exportación CSV | Los números coinciden con la base |
| 6. Pulido visual | Dom 25 | Identidad cusqueña, logo, textos, estados, revisión móvil | Se ve como el diseño definido |
| 7. Pruebas | Lun 26 a Mié 28 | Datos de prueba (250 registros), prueba de carga, pruebas con celulares reales, revisión de seguridad | Lista de pruebas de la sección 13 aprobada |
| 8. Operación | Jue 29 a Vie 30 | Simulacro en el lugar si se puede, respaldos, listas impresas, capacitación de guardias y admins, comando de borrado de datos listo | Todos saben qué hacer. Respaldo descargado |
| Evento | Sáb 31 | Operación y soporte | |

**Calendario operativo del cobro y envío de QR**
- Desde el viernes 16: se comparte el enlace de registro.
- Del sábado 24 en adelante: se envían QR por lotes cada día a los pagados.
- Jueves 29: último envío general. A partir de ahí, se envía individualmente.

---

## 13. Pruebas obligatorias

1. Registro con DNI repetido, con datos inválidos y con campos vacíos.
2. Marcar pagado, revertir y volver a marcar: el token y el código no deben cambiar sin motivo ni dejar registros inconsistentes.
3. Envío de lotes: simular fallo de correo y verificar que se puede reintentar.
4. QR legible desde pantalla de celular y desde papel, en diferentes marcas de celular.
5. Escaneo simultáneo del mismo QR desde dos celulares (prueba de atomicidad).
6. QR de alguien pendiente, cancelado, inexistente y ya ingresado.
7. Ingreso con código corto y con DNI.
8. Registro y cobro en puerta, con ingreso inmediato.
9. Pérdida de internet durante el escaneo: el sistema muestra un error claro y no un falso "válido".
10. PIN incorrecto repetido: bloqueo temporal.
11. Intentar abrir rutas de admin sin sesión.
12. Prueba con 250 registros y 4 a 6 dispositivos operando a la vez.
13. Exportación CSV completa y abierta en Excel con tildes y eñes correctas.

---

## 14. Plan de contingencia del día del evento

- Dos listas de respaldo: el Excel de los coordinadores y el CSV exportado del sistema el viernes 30 y el sábado en la mañana.
- Si falla el QR de una persona: código corto o DNI.
- Si falla internet en la puerta: activar los datos móviles de un celular como punto de acceso y usar el respaldo impreso con marcas manuales.
- Si cae el sistema completo: entrada por lista de respaldo y registrar los ingresos de forma manual para luego subirlos.
- Un admin con la sesión abierta en la puerta durante toda la noche.
- Cargar los celulares de la puerta y llevar cargadores.

---

## 15. Instrucciones para Claude Code

### 15.1 Reglas de trabajo

- Trabajar fase por fase, en el orden de la sección 12. No avanzar sin cumplir el criterio de terminado.
- Al terminar cada fase, resumir qué se hizo, cómo probarlo y qué falta.
- Usar TypeScript estricto, Next.js App Router, Tailwind y Zod.
- Mantener el código simple y legible. No agregar librerías que no se necesiten.
- Toda la lógica sensible (pagos, token, ingreso, PIN, correo) va en el servidor.
- Escribir en español los textos visibles y en inglés los nombres internos si se prefiere, pero de forma consistente.
- Documentar en un `README.md` cómo correr el proyecto, las variables de entorno y cómo crear admins.
- Entregar un script de datos de prueba (`seed`) con 250 asistentes ficticios, y un script de borrado o anonimización de datos reales para después del evento.

### 15.2 Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GUARD_PIN=
SESSION_SECRET=
GMAIL_USER=
GMAIL_APP_PASSWORD=
APP_URL=
TICKET_PRICE=20
EVENT_CAPACITY=250
```

### 15.3 Mensaje inicial sugerido para Claude Code

> Vas a construir "Ukhu Pacha Pass", un sistema web de registro, pagos y control de acceso con QR para una fiesta de Halloween de 200 a 250 personas. Lee `ukhu-pacha-pass-plan.md` completo antes de escribir código. Trabaja por fases en el orden de la sección 12 y empieza por la fase 0 y la fase 1. Antes de programar, confirma el stack, el modelo de datos y las decisiones pendientes de la sección 3 (usa los valores por defecto indicados si no hay respuesta). Ten especial cuidado con el marcado atómico de ingreso, el manejo de claves y la validación en servidor. Al terminar cada fase, dime qué hiciste y cómo probarlo.

---

## 16. Riesgos principales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Doble ingreso por escaneo simultáneo | Alto | Actualización atómica en base de datos y prueba específica |
| Falla de internet en la puerta | Alto | Respaldo CSV y Excel, datos móviles de contingencia |
| Límite diario de correos | Medio | Envío en lotes por varios días, página `/entrada` para compartir por WhatsApp |
| Pausa de la base gratuita | Medio | Mantener actividad y verificar el día anterior |
| Fraude o error al marcar pagos | Medio | Solo admins marcan, con historial de quién y cuándo |
| Menores con acceso a alcohol | Alto | Casilla de edad, marca de menor, aviso en el escáner y control en la barra |
| Exposición de datos personales | Alto | Mínimo de datos, DNI enmascarado, borrado después del evento |
| Tiempo insuficiente | Medio | Fases con criterio de terminado, congelar cambios el 28, dejar premios de disfraz como opcional |

---

## 17. Mejoras opcionales (solo si sobra tiempo)

- Votación y premios por disfraz con una pantalla de votación durante la fiesta.
- Botón para compartir la entrada por WhatsApp.
- Estadísticas de hora de llegada.
- Reporte final de ingresos, gastos y asistencia.
- Dominio propio y servicio de correo transaccional.
