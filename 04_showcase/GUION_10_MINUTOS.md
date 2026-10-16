# Guion de diez minutos

Es la sección 7.6 de la guía; «este capítulo» es el capítulo 7. Las referencias a figuras («figura 7.3») y a tablas («Los tres en números») remiten a ese documento.

Presentar un sistema que depende de un modelo gratuito en la nube tiene un riesgo: la demostración puede fallar por razones ajenas a lo que construiste. Casi todas se evitan preparando tres cosas. La primera, **elegir qué se muestra en vivo**: la alternativa que construiste tú, y las otras dos como figuras de este capítulo o en modo demostración. Recorrer los cuatro ejemplos en una alternativa gasta 7 llamadas al modelo en n8n y LangChain y 6 en Make (en las pruebas, con el modelo simulado), y mostrar las tres seguidas gasta unas 20; el modelo gratuito admite 50 al día, y repetir un ejemplo para el público o dejar que la sala lo pruebe en vivo agota ese cupo en minutos. La segunda, **calentar el sistema** unos minutos antes de empezar, con el probador, que además te dice si la cuota sigue disponible. La tercera, **tener un plan B a mano y decir que lo es**.

| Minuto | Qué haces | Qué dices (la idea central) |
|---|---|---|
| 0:00 | Abre tu dirección pública. Señala el indicador «Conectado · …» y los cuatro ejemplos. | «Es la mesa de ayuda de una tienda ficticia. Una persona de soporte pega el mensaje de un cliente y recibe una respuesta sugerida, con las políticas en que se apoya.» |
| 1:00 | Pulsa **Devolución** y analiza. Mientras espera, explica lo que ocurre detrás. Al terminar, muestra la respuesta, la política citada y el pedido consultado. | «Cada afirmación tiene una política que la respalda, y los datos del pedido salen de una tabla, no de la imaginación del modelo.» |
| 3:00 | **Producto dañado**. Abre **Qué hizo el sistema** y **Detalles técnicos**. | «Aquí hay que combinar dos reglas, el plazo de 48 horas y la garantía. Estos son los pasos: sirven para auditar de dónde salió cada dato.» |
| 5:00 | **Pedido inexistente** y **Fuera de alcance**. | «Un sistema útil también sabe cuándo no responder. No inventa un pedido: lo deriva a una persona.» |
| 6:30 | Abre la vista de la plataforma con la ejecución que acabas de hacer: **Executions**, **History** o los **Logs** de Vercel con el ID que muestra la pantalla. | «Esto es lo que ve quien lo mantiene. El registro guarda el estado y el tiempo, no lo que escribió el cliente.» |
| 8:00 | Muestra una falla controlada (recuadro siguiente) o la figura 7.3. | «Cuando algo falla, la pantalla dice qué pasó y qué hacer. No se queda en blanco ni muestra el error de otra plataforma.» |
| 9:00 | Cierra con la tabla «Los tres en números» y di cuál elegirías, y por qué. | «No hay una alternativa mejor en general: depende de si tu camino es fijo o depende de lo que diga el cliente.» |

> **Una falla que no gasta cuota.** Si definiste `ACCESS_CODE` en Vercel (capítulo 8), escribe un código equivocado en el campo **Código de acceso** y analiza un ejemplo: la pantalla responde «Falta el código de acceso» con el aviso de que no es correcto, y el proxy corta la consulta antes de llamar al backend, así que no se gasta ni una llamada al modelo. Es la falla más segura de provocar en vivo.

> **Si algo falla en vivo.** No repitas la consulta a toda velocidad: cada intento gasta cuota y, si el problema es el límite del modelo, solo lo agrava. Lee el código que muestra la pantalla, dilo en voz alta y busca su explicación en la sección 8.7. Si no se arregla, pasa al modo demostración (`?demo=1`) o a las figuras de este capítulo **avisando** que ya no es el sistema real. Un público perdona una falla bien explicada; no perdona una demostración guardada presentada como si fuera el sistema.
