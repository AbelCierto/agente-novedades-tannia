# Kit MVP · De PoC a MVP con una pantalla web y Vercel

Curso AI Project · BSG Institute · Versión 1.0 · Octubre 2026

Este kit convierte el PoC de la mesa de ayuda de Tienda Nimbo (el que hiciste en n8n, en Make o con LangChain) en un MVP:
una pantalla web simple, un proxy pequeño y una dirección pública en Vercel. La guía `Guia_MVP_Vercel.pdf` explica cada paso;
esta carpeta trae los archivos que la guía te pide usar.

## Cómo está organizado

| Carpeta | Qué trae |
|---|---|
| `00_comun/` | El contrato de datos entre la pantalla y el proxy (`contrato_v1.md` y `contrato.schema.json`). Es el mismo para las tres alternativas. |
| `01_n8n/` | Alternativa n8n (ruta C, agente): el workflow para importar, el probador y el proyecto para Vercel. |
| `02_make/` | Alternativa Make (ruta B, workflow): el blueprint para importar, el manual para construir el escenario a mano si la importación falla, el probador y el proyecto para Vercel. |
| `03_langchain/` | Alternativa LangChain (ruta C, agente): el probador y el proyecto para Vercel. No hay nada que importar: el agente es el código del proyecto. |
| `04_showcase/` | Capturas de los tres montajes funcionando y un guion de diez minutos para presentarlos. |
| `05_entrega/` | La lista de lo que se entrega (`QUE_ENTREGAR.md`) y las pruebas de seguridad que se anotan (`PRUEBAS_DE_SEGURIDAD.md`). |

## Por dónde empezar

1. Lee los capítulos 1 a 3 de la guía: la arquitectura, la pantalla con su contrato y cómo funciona Vercel.
2. Abre la carpeta que corresponde a tu PoC (`01_n8n/`, `02_make/` o `03_langchain/`) y lee su `LEEME.md`, que resume los pasos en
   una página. El tutorial completo está en el capítulo 4, 5 o 6.
3. Cuando tu dirección pública funcione, prepara la entrega con el capítulo 9 y la carpeta `05_entrega/`.

Si dudas entre las tres alternativas, la tabla de decisión está en la sección 1.5 de la guía.

## Reglas del curso

- Se trabaja solo con datos sintéticos o anonimizados.
- Ninguna clave va en un archivo que subas a GitHub, adjuntes a una entrega o fotografíes para una captura. El archivo `.env` no se
  sube nunca (el `.gitignore` de cada proyecto ya lo excluye). Los archivos de este kit solo traen textos de ejemplo, como
  `PEGA_AQUI_TU_CLAVE_DE_OPENROUTER`.
- Si una clave llegó a publicarse, se revoca primero y después se crea otra (sección 8.6 de la guía).

## Qué se probó y qué no

Todo se probó en un laboratorio con un modelo de lenguaje **simulado**: el workflow de n8n, en una instancia real de n8n (2.42);
la pantalla, en un navegador real; el proxy y el agente de LangChain, con pruebas automáticas; y el blueprint de Make, con un
intérprete propio que ejecuta módulos, filtros y manejadores de error según la documentación de Make.

**No se pudo probar** el despliegue real en Vercel (incluidos el firewall, la protección de despliegues y el cambio de claves del
capítulo 8), la importación del blueprint en una cuenta real de Make ni llamadas reales a OpenRouter. Para eso la guía se apoya en la
documentación oficial de octubre de 2026 y avisa dónde verificar. Si algo de lo que ves no coincide con lo que dice la guía, anótalo:
es justo lo que hace falta para corregirla.

## Documentación oficial

Si algo no coincide con la guía, manda la documentación de cada plataforma: vercel.com/docs, docs.n8n.io, help.make.com,
openrouter.ai/docs y docs.langchain.com.
