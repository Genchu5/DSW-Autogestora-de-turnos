# Autogestora de Turnos — Consultorios de Jardín

Frontend de la aplicación de autogestión de turnos médicos/consultorios. Construido con **React 19 + TypeScript + Vite 7**.

## Descripción general

Sistema web para la gestión de turnos con tres roles de usuario:

- **Admin**: CRUD de usuarios, provincias, ciudades, consultorios y salas.
- **Profesional**: visualización y gestión de su propia agenda de turnos.
- **Cliente**: solicitud, consulta y cancelación de turnos.

Incluye autenticación JWT, integración con Google reCAPTCHA, notificaciones toast y un asistente de IA integrado.

## Requisitos previos

- Node.js >= 18
- npm
- Backend corriendo en `http://localhost:3000`

## Instalación

```bash
npm install
```

## Ejecución

### Desarrollo

```bash
npm run dev
```

Inicia el servidor de desarrollo de Vite en `http://localhost:5173`.
Las llamadas a `/api` se redirigen automáticamente al backend en `localhost:3000` (configurado en `vite.config.ts`).

### Build de producción

```bash
npm run build
```

### Preview del build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Tests

### Unit tests — Vitest

Ejecutar todos los tests una vez:

```bash
npx vitest run
```

Ejecutar en modo watch (re-ejecuta al guardar cambios):

```bash
npx vitest
```

Tecnologías utilizadas: **Vitest** + **@testing-library/react** + **jsdom**.
Setup file: `src/setupTests.ts`.

### Tests E2E — Playwright

Ejecutar todos los tests E2E:

```bash
npx playwright test
```

Ejecutar en modo con interfaz visual:

```bash
npx playwright test --ui
```

Ver reporte HTML del último run:

```bash
npx playwright show-report
```

Los tests están en el directorio `testsE2E/` y se ejecutan en Chromium, Firefox y WebKit.

## Estructura del proyecto

```
src/
├── App.tsx                   # Configuración de rutas
├── PrivateRoutes.tsx          # Protección de rutas por rol
├── axios.ts                  # Instancia Axios con interceptores JWT
├── setupTests.ts             # Setup de tests unitarios
├── context/
│   ├── AuthContext.tsx        # Contexto de autenticación
│   └── AuthWatcher.tsx        # Watcher de sesión
├── components/
│   ├── chatAssistant/         # Widget asistente de IA
│   ├── crudNav/               # Navegación de CRUDs
│   ├── defaultLayout/         # Layout base
│   ├── header/                # Encabezado
│   ├── inputs/                # Inputs reutilizables
│   ├── navZone/               # Navegación lateral
│   ├── searchBar/             # Barra de búsqueda
│   └── reCaptcha.tsx          # Componente reCAPTCHA
└── pages/
    ├── adminCRUDS/            # Páginas CRUD del admin
    ├── appointments/          # Gestión de turnos
    ├── homePages/             # Páginas de inicio por rol
    ├── login/                 # Login
    ├── register/              # Registro
    ├── newPassword/           # Recuperación de contraseña
    ├── scheduleProfessional/  # Agenda del profesional
    ├── editProfie/            # Edición de perfil
    ├── notFoundPage/          # Página 404
    ├── commonServices.ts      # Servicios compartidos
    └── types.ts               # Tipos TypeScript globales
```

## Variables de entorno

No se requieren variables de entorno para desarrollo. La URL del backend se configura via proxy en [`vite.config.ts`](vite.config.ts).

El token JWT se almacena en `localStorage` bajo la clave `"token"`.
