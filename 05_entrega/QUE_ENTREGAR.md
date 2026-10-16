# Qué entregar

Es el capítulo 9 de la guía, con casillas para marcar. Las referencias a secciones remiten a ese documento.

Entregar un MVP es dejar que otra persona lo abra, lo pruebe y entienda cómo está hecho, sin que reciba tus claves. Este capítulo lista las siete piezas de la entrega, cómo conseguir cada una y cómo comprobar que no va ninguna clave dentro.

## Qué se entrega

Una entrega son dos cosas: un MVP que se pueda abrir y usar, y la evidencia de cómo está hecho y de cómo se comportó. Son siete piezas, y ninguna lleva una clave.

- [ ] **1. Dirección pública y código de acceso.** La dirección de tu proyecto en Vercel, que muestra la pantalla sin pedir una cuenta de Vercel. Y el código, solo si definiste `ACCESS_CODE`.
  *Cómo la consigues:* Copia el dominio de producción y ábrelo en una ventana privada. El código se manda aparte, por mensaje privado, y se cambia al terminar (sección 8.6).
- [ ] **2. Repositorio.** El enlace a GitHub con el contenido de `proyecto-vercel/`, con su `.gitignore` y sin `.env`.
  *Cómo la consigues:* Público, o privado con acceso para quien evalúa. Antes, las dos búsquedas de claves de la sección 8.6.
- [ ] **3. El backend exportado.** **n8n:** el workflow en JSON. **Make:** el blueprint en JSON, sin la clave. **LangChain:** nada que exportar: el backend es el código del repositorio (`agente.py` y `busqueda.py`).
  *Cómo la consigues:* **n8n:** menú **⋯** del workflow › **Download**. **Make:** menú **⋯** del editor › **Export Blueprint**, y la revisión de abajo.
- [ ] **4. Salida del probador.** Los cuatro ejemplos contra tu dirección pública, todos con ✓. Apunta a Vercel, no al webhook.
  *Cómo la consigues:* Guarda la salida en un archivo: `python3 probar_endpoint.py https://TU-PROYECTO.vercel.app --codigo-acceso EL_CODIGO > probador.txt`. Sin la opción del código si no usas uno.
- [ ] **5. Tres capturas.** La pantalla con una respuesta, con la política y el pedido a la vista; la vista de la plataforma de esa misma consulta (**Executions**, **History** o **Logs**), con la hora de la ejecución a la vista; y una falla controlada, como un código de acceso incorrecto.
  *Cómo la consigues:* Son las del guion del capítulo 7. Ninguna debe mostrar credenciales, ni la cabecera `Authorization` de los módulos 3 y 14 de Make.
- [ ] **6. Pruebas de seguridad.** Los seis mensajes de la sección 8.4 y lo que respondió tu montaje, incluso lo que salió mal.
  *Cómo la consigues:* El archivo `05_entrega/PRUEBAS_DE_SEGURIDAD.md` del kit, completado.
- [ ] **7. Nota de entrega.** Media página: qué alternativa elegiste y por qué, qué funciona, qué no funciona todavía y qué cambiarías.
  *Cómo la consigues:* Un archivo `LEEME.md` con la dirección pública y el enlace al repositorio, sin el código de acceso.

## Que no vaya ninguna clave

Antes de enviar nada, haz esta revisión y repítela si cambias un archivo. Cada paso mira un lugar distinto, y las claves se filtran por el que no se miró.

**El repositorio.** Corre las dos búsquedas de la sección 8.6, la de los archivos actuales y la del historial. Si alguna imprime algo, la clave ya estuvo publicada: revócala y crea otra, como dice esa sección, antes de seguir.

**El export.** Ábrelo en un editor de texto, no en un procesador de palabras, y busca `sk-or-` y `Bearer`. El export de n8n guarda el nombre de las credenciales y no su valor: la búsqueda debe dar cero resultados. El blueprint de Make sí guarda la clave, en las cabeceras de los módulos 3 y 14: deja en cada una `Bearer PEGA_AQUI_TU_CLAVE_DE_OPENROUTER`, como en el kit, y borra el archivo original.

**Las capturas y el probador.** Mira cada imagen antes de adjuntarla: sin campos de credenciales, sin cabeceras `Authorization` y sin variables de Vercel con algún valor a la vista. Y abre `probador.txt`: no debe traer el código de acceso ni ningún token.

## Cómo ordenarlo

Con este orden, la carpeta se revisa en cinco minutos. Entrégala comprimida por el canal que indique el curso, y el código de acceso aparte.

```
entrega_TU-NOMBRE/
├── LEEME.md                   la nota de entrega: alternativa, dirección pública y repositorio
├── PRUEBAS_DE_SEGURIDAD.md    los seis mensajes y lo que respondió tu montaje
├── export/                    workflow de n8n o blueprint de Make, sin claves
└── evidencia/
    ├── probador.txt
    ├── 1-pantalla.png
    ├── 2-plataforma.png
    └── 3-falla.png
```

Si una pieza no se pudo conseguir, dilo en la nota, con el error tal como apareció: una entrega que muestra su falla enseña más, y permite ayudarte, que una que calla.
