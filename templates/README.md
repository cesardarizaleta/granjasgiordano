# Generador de Features

Este script automatiza la creación de nuevas features siguiendo el patrón de módulos establecido en el proyecto.

## Uso

```bash
npm run generate-feature <nombre-feature>
```

### Ejemplos

```bash
# Crear una feature de productos
npm run generate-feature productos

# Crear una feature de reportes
npm run generate-feature reportes

# Crear una feature de usuarios
npm run generate-feature usuarios
```

## Estructura Generada

El generador crea automáticamente la siguiente estructura:

```
src/features/<feature>/
├── index.ts                    # Exports principales de la feature
├── pages/
│   └── <Feature>.tsx          # Página principal (componente React)
├── services/
│   └── <feature>Service.ts     # Servicio con operaciones CRUD básicas
├── components/
│   └── <Feature>Component.tsx  # Componente de ejemplo
├── hooks/
│   └── use<Feature>.ts         # Hook personalizado para la lógica
├── types/
│   └── <feature>.ts            # Definiciones de tipos específicas
└── utils/
    └── <feature>Utils.ts       # Utilidades y funciones helper
```

## Archivos Actualizados Automáticamente

- `src/services/index.ts`: Agrega la exportación del nuevo servicio
- `src/features/index.ts`: Agrega la exportación de la nueva feature

## Próximos Pasos Después de Generar

1. **Revisar tipos**: Ajusta las interfaces en `types/<feature>.ts` según tus necesidades
2. **Implementar servicio**: Completa la lógica en `<feature>Service.ts` (conexiones a Supabase, validaciones, etc.)
3. **Crear componentes**: Agrega componentes específicos en la carpeta `components/`
4. **Configurar rutas**: Agrega la nueva ruta en `App.tsx`
5. **Actualizar navegación**: Modifica el menú/sidebar si es necesario
6. **Probar**: Ejecuta `npm run build` y `npm run dev` para verificar

## Plantillas Incluidas

Las plantillas incluyen:

- **Servicio**: Clase con métodos CRUD básicos (get, create, update, delete) usando Supabase
- **Componente**: Componente React básico con Card de shadcn/ui
- **Hook**: Hook personalizado con estado de loading, error y data
- **Página**: Página básica con estructura de layout
- **Tipos**: Interfaces base para la entidad
- **Utils**: Funciones helper de ejemplo

## Personalización

Los placeholders `{{name}}` y `{{Name}}` se reemplazan automáticamente:

- `{{name}}`: nombre en minúsculas (ej: productos)
- `{{Name}}`: nombre en PascalCase (ej: Productos)

## Notas

- El generador asume que usarás Supabase como backend
- Los tipos base usan la estructura estándar del proyecto
- Todas las importaciones usan paths absolutos con `@/`
- El código generado sigue las convenciones de ESLint del proyecto
