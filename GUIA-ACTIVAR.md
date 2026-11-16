# Activar MondQuest con Google Sheets, Staff y Admin

## 1. Crear la hoja
1. En Google Drive: Nuevo > Subir archivo > `sheets/mondquest-sheet.xlsx`.
2. Ábrelo y elige Archivo > Guardar como hoja de cálculo de Google.
3. Mantén las pestañas con sus nombres exactos.

## 2. Poner el servidor
1. En la hoja: Extensiones > Apps Script.
2. Borra el código y pega todo `sheets/Code.gs`. Guarda.
3. Engranaje (Configuración del proyecto) > Propiedades de la secuencia de comandos > añade tres:
   - `WRITE_KEY`: una clave larga inventada (la usará `config.js`)
   - `STAFF_PIN`: PIN del staff
   - `ADMIN_PIN`: PIN de administración, distinto y más largo
4. Implementar > Nueva implementación > Aplicación web. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier usuario**.
5. Autoriza los permisos y copia la URL que acaba en `/exec`.

## 3. Conectar la web
En GitHub edita `config.js`:
```
window.MQ_CONFIG={sheetUrl:'URL-EXEC',writeKey:'LA-WRITE_KEY',tiles:{url:'',name:'',attribution:''}};
```
Sube también los archivos nuevos: `staff.html`, `admin.html`, `panel.css`, `js/api.js`, `js/06-sheet.js` y el `index.html` actualizado (lo más fácil es subir todo el contenido del zip de nuevo).

## 4. Usar
- Jugadores: `https://TU-USUARIO.github.io/TU-REPO/`
- Staff (móvil en el circo): `.../staff.html` con el STAFF_PIN
- Admin: `.../admin.html` con el ADMIN_PIN

Cada vez que cambies `Code.gs` hay que hacer Implementar > Gestionar implementaciones > Editar > Nueva versión.

## Seguridad
- Los PIN nunca están en GitHub. 8 PIN fallidos bloquean 10 minutos.
- `writeKey` está en un repositorio público: solo frena el spam, no es un secreto.
- Los puntos los calcula el teléfono del jugador (modelo de confianza). Revisa la pestaña Activity y usa Players para marcar a alguien como `flagged` o corregir puntos.
