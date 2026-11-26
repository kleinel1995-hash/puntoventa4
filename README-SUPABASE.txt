PUNTO DE VENTA — SUPABASE Y SINCRONIZACIÓN EN TIEMPO REAL

ARCHIVOS INCLUIDOS
- Todas las páginas del sistema.
- supabase-config.js: configuración del proyecto.
- supabase-sync.js: sincronización automática y escucha Realtime.
- supabase-setup.sql: crea la tabla necesaria y habilita Realtime.

PASO 1 — CREAR TABLA
1. Entra a tu proyecto Supabase.
2. Abre SQL Editor > New query.
3. Abre supabase-setup.sql de esta carpeta, copia TODO y ejecútalo (Run).
4. Verifica que la tabla public.pos_app_data exista.

PASO 2 — PONER LA CLAVE PÚBLICA
1. Supabase > Project Settings > API Keys.
2. Copia la Publishable key (sb_publishable_...) o la anon/public legacy.
3. Abre supabase-config.js.
4. Conserva la URL del proyecto que está configurada y pega tu clave en SUPABASE_ANON_KEY.
   Ejemplo: window.SUPABASE_ANON_KEY = "sb_publishable_...";
5. Guarda el archivo.

NO PEGUES en el frontend una sb_secret ni service_role. Si una clave secreta
se compartió o se publicó anteriormente, revócala y genera una nueva.

PASO 3 — SUBIR LA APP
Sube TODOS los archivos y páginas a la misma carpeta de tu hosting. Sirve el sitio
por HTTPS (no abras los HTML como archivos locales). Abre index.html y prueba.

QUÉ SINCRONIZA
La integración sincroniza los datos almacenados bajo estas claves:
productosPOS, inventarioPOS, comprasPOS, ventasPOS, cotizacionesPOS, clientesPOS,
gastosPOS, proveedoresPOS, configNegocio, configImpuesto, configImpresora,
configPagos, usuariosPOS, cierresPOS y usuarioActualPOS.

Cuando un módulo guarda sus datos en localStorage, el script envía la actualización
a Supabase con un pequeño retraso. Los cambios recibidos por Realtime se aplican
al almacenamiento local y disparan eventos para que los módulos refresquen sus vistas.
La primera apertura intenta descargar la copia de la nube antes de recargar la página.

PRUEBA
- Abre el sistema en dos dispositivos/navegadores.
- Crea un producto en uno; comprueba si aparece en el otro.
- Registra una venta y revisa ventas e inventario en ambos.
- En consola, window.posSupabase debe existir y el canal debe estar suscrito.
- Puedes forzar el envío de datos locales con: await window.posSyncNow()

IMPORTANTE SOBRE SEGURIDAD
El SQL incluido usa políticas de acceso abiertas (anon/authenticated) para facilitar
una prueba inicial sin login de Supabase Auth. Esto significa que cualquier persona
que tenga la URL y la clave pública podría leer/modificar la tabla. No uses esa
configuración con datos reales ni la publiques sin protegerla.
Antes de producción, debe implementarse Supabase Auth y políticas RLS que separen
cada negocio/usuario. Esta integración no convierte por sí sola el login local en
un login seguro de Supabase.

RESPALDO
Supabase es la copia central; localStorage sigue funcionando como caché/fallback.
No elimines los datos locales ni cambies políticas hasta confirmar que sincroniza.
