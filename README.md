# Gemini CLI UI Capture Kit

Este kit permite capturar interfaces web reales y convertirlas en capas vectoriales de alta fidelidad dentro de Figma. Es un puente universal entre el código en ejecución y el diseño, permitiendo una sincronización perfecta sin capturas de pantalla estáticas.

## Requisitos del Proyecto Objetivo

Para que el kit funcione de manera óptima con cualquier proyecto, se recomienda:

1.  **Tab de Storyboard (Recomendado):** Crear una ruta o pestaña (ej. `/master-scan`) que renderice todos los componentes, modales y estados uno al lado del otro. Esto permite al kit escanear todo sin necesidad de navegar manualmente por modales flotantes.
2.  **Selectores Estables:** Asegurarse de que los elementos importantes tengan clases o atributos predecibles (MUI funciona perfecto por defecto).
3.  **Fuentes Estándar:** El kit prioriza **Helvetica Neue** con fallbacks a Inter y Roboto.

## Instalación del Kit

Si deseas usar este kit de forma independiente (fuera de tu proyecto principal):

```bash
git clone https://github.com/coviyarce/gemini-cli-ui-capture.git
cd gemini-cli-ui-capture
npm install
```

## Uso y Ejecución

### 1. Configuración
Edita `capture-config.json` para apuntar a tu servidor local y definir las pantallas:

```json
{
  "baseUrl": "http://localhost:5173",
  "screens": [
    { "category": "Scan", "id": "master", "name": "Full Scan", "tabIndex": 4, "selector": "body" }
  ]
}
```

### 2. Captura de la UI
Asegúrate de que tu aplicación esté corriendo y ejecuta el script de captura:

*   **Rescan Completo (Recomendado):** Reconstruye el archivo de datos desde cero.
    ```bash
    node scripts/capture-to-figma.cjs --rebuild
    ```
*   **Actualización Incremental:** Solo añade pantallas nuevas definidas en el config.
    ```bash
    node scripts/capture-to-figma.cjs
    ```

### 3. Inyección en el Plugin
Sincroniza los datos capturados con el plugin local de Figma:
```bash
node scripts/update-plugin.cjs
```

### 4. Importación en Figma
1.  En Figma, ve a `Plugins > Development > Import plugin from manifest...`.
2.  Selecciona el archivo `figma-plugin/manifest.json` de esta carpeta.
3.  Abre el plugin, selecciona las pantallas y haz clic en **Import Selected**.

## Características de Alta Fidelidad
- **Vectorización Real:** No son imágenes; son frames, vectores y textos reales de Figma.
- **Soporte de Formularios:** Captura valores de `input`, `select` y placeholders.
- **Portales y Modales:** Detecta elementos renderizados fuera del flujo normal (como Portals de MUI).
- **Resoluciones Múltiples:** Captura automática en 1080p y 720p.

---
Built by [Coviyarce](https://github.com/coviyarce/gemini-cli-ui-capture)
