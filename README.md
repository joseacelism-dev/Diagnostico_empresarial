# Diagnóstico Empresarial

Aplicación web para realizar un diagnóstico integral de madurez empresarial. El flujo captura información de la empresa, presenta un cuestionario adaptativo por áreas de gestión y genera un dashboard con resultados, riesgos, oportunidades y recomendaciones priorizadas. También permite exportar un informe ejecutivo en PDF.

## Tecnologías

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- jsPDF, jsPDF AutoTable y html2canvas

## Requisitos

- Node.js
- pnpm

## Instalación

```bash
pnpm install
```

## Desarrollo

```bash
pnpm run dev
```

Por defecto, Vite levanta el servidor en el puerto configurado por `PORT` o en `8443`.

## Build de producción

```bash
pnpm run build
```

Los archivos compilados se generan en `dist/`.
