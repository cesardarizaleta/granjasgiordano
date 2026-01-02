# Feature Modules

Esta carpeta contiene módulos organizados por feature (funcionalidad). Cada módulo es independiente y contiene su propio código relacionado.

## Estructura Estándar por Módulo

Cada carpeta de módulo (ej. `clientes/`) debe tener la siguiente estructura:

- `pages/`: Componentes de página principales (ej. `Clientes.tsx`).
- `services/`: Servicios para API y lógica de negocio (ej. `clienteService.ts`).
- `components/`: Componentes específicos del módulo (ej. modales, tablas).
- `hooks/`: Hooks personalizados del módulo.
- `types/`: Tipos TypeScript específicos.
- `utils/`: Utilidades y helpers.
- `index.ts`: Archivo de exports para facilitar imports.

## Importación

Usa paths absolutos con `@/`:

```tsx
import { ClientesPage } from "@/features/clientes";
```

## Beneficios

- Modularidad: Código relacionado agrupado.
- Escalabilidad: Fácil agregar nuevos módulos.
- Mantenimiento: Cambios locales a un módulo.
- Testing: Tests por módulo independientes.
