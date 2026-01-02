# GitHub Copilot Instructions - Carbon Zulianita

## 🏗️ Arquitectura del Proyecto

Este proyecto es una aplicación React moderna de gestión empresarial con la siguiente arquitectura:

### **Tecnologías Principales**

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Quality**: ESLint + Prettier + TypeScript
- **PWA**: Vite PWA Plugin

### **Estructura por Features**

Organización modular por funcionalidades independientes:

```
src/features/[feature]/
├── pages/          # Componentes de página principales
├── services/       # Lógica de negocio y llamadas API
├── components/     # Componentes específicos del módulo
├── hooks/          # Hooks personalizados del módulo
├── types/          # Tipos TypeScript específicos
├── utils/          # Utilidades y helpers
└── index.ts        # Archivo de exports
```

## 📋 Buenas Prácticas de Desarrollo

### **1. Arquitectura por Features**

- ✅ Crear nuevas funcionalidades usando el script: `npm run generate:feature <name>`
- ✅ Mantener código relacionado agrupado en módulos independientes
- ✅ Usar imports absolutos con `@/` para referencias
- ✅ Exportar desde `index.ts` para facilitar imports

### **2. State Management (Zustand)**

```typescript
interface StoreState {
  // Estado
  data: Type | null;
  loading: boolean;

  // Acciones
  setData: (data: Type) => void;
  fetchData: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  // Implementación
}));
```

### **3. Servicios y API**

- ✅ Usar servicios para lógica de negocio
- ✅ Implementar manejo de errores consistente con `ErrorFactory`
- ✅ Usar React Query para data fetching
- ✅ Tipos consistentes en `src/services/types.ts`

### **4. Componentes**

- ✅ Usar componentes de shadcn/ui para UI consistente
- ✅ Implementar loading states y error boundaries
- ✅ Usar hooks personalizados para lógica reutilizable
- ✅ Formularios con React Hook Form + Zod validation

### **5. Tipos TypeScript**

- ✅ Definir interfaces específicas por feature
- ✅ Usar tipos estrictos, evitar `any`
- ✅ Exportar tipos desde archivos dedicados
- ✅ Usar utility types cuando sea apropiado

### **6. Manejo de Errores**

```typescript
import { ErrorFactory, ErrorType } from "@/lib/errors";

// Para errores de red
throw ErrorFactory.network("Error de conexión");

// Para errores de validación
throw ErrorFactory.validation("Campo requerido");

// Para errores de autenticación
throw ErrorFactory.authentication("Usuario no autorizado");
```

## 🛠️ Comandos Disponibles

### **Desarrollo**

```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run build:dev        # Build de desarrollo
npm run preview          # Preview del build
```

### **Calidad de Código**

```bash
npm run lint             # Ejecutar ESLint
npm run lint:fix         # Corregir errores de ESLint automáticamente
npm run type-check       # Verificar tipos TypeScript
npm run format           # Formatear código con Prettier
npm run code-quality     # Ejecutar todas las verificaciones
```

### **Generación de Features**

```bash
# Crear nueva feature automáticamente
node scripts/generate-feature.cjs <feature-name>

# Ejemplos:
node scripts/generate-feature.cjs productos
node scripts/generate-feature.cjs reportes
```

## 📁 Patrones de Código

### **Creación de un Nuevo Servicio**

```typescript
// src/features/[feature]/services/[feature]Service.ts
import { supabaseWrapper } from '@/services/supabaseWrapper';
import { ErrorFactory } from '@/lib/errors';
import type { [Feature]Type } from '../types/[feature].ts';

export const [feature]Service = {
  async getAll(): Promise<{ data: [Feature]Type[] | null; error: string | null }> {
    try {
      const { data, error } = await supabaseWrapper
        .from('[table_name]')
        .select('*');

      if (error) throw ErrorFactory.network(error.message);

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async create(item: Omit<[Feature]Type, 'id'>): Promise<{ data: [Feature]Type | null; error: string | null }> {
    // Implementación similar
  }
};
```

### **Hook Personalizado**

```typescript
// src/features/[feature]/hooks/use[Feature].ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { [feature]Service } from '../services/[feature]Service';
import { useToast } from '@/hooks/use-toast';

export function use[Feature]() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['[feature]'],
    queryFn: [feature]Service.getAll,
  });

  const createMutation = useMutation({
    mutationFn: [feature]Service.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[feature]'] });
      toast({ title: "Éxito", description: "Elemento creado correctamente" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  return {
    data,
    isLoading,
    error,
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
```

### **Componente con Formulario**

```tsx
// src/features/[feature]/components/[Feature]Form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const [feature]Schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  // otros campos...
});

type [Feature]FormData = z.infer<typeof [feature]Schema>;

interface [Feature]FormProps {
  onSubmit: (data: [Feature]FormData) => void;
  isLoading?: boolean;
}

export function [Feature]Form({ onSubmit, isLoading }: [Feature]FormProps) {
  const form = useForm<[Feature]FormData>({
    resolver: zodResolver([feature]Schema),
    defaultValues: {
      name: '',
      // otros valores por defecto...
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </Form>
  );
}
```

### **Página Principal del Feature**

```tsx
// src/features/[feature]/pages/[Feature].tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { use[Feature] } from '../hooks/use[Feature]';
import { [Feature]Table } from '../components/[Feature]Table';
import { [Feature]Modal } from '../components/[Feature]Modal';

export function [Feature]Page() {
  const { data, isLoading, create, isCreating } = use[Feature]();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">[Feature]</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo [Feature]
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de [Feature]</CardTitle>
        </CardHeader>
        <CardContent>
          <[Feature]Table
            data={data || []}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <[Feature]Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={create}
        isLoading={isCreating}
      />
    </div>
  );
}
```

## 🎯 Principios Generales

1. **Consistencia**: Seguir los mismos patrones en todos los features
2. **Type Safety**: Usar TypeScript estrictamente, evitar `any`
3. **Error Handling**: Manejar errores de forma consistente
4. **Performance**: Usar React Query para caching y optimización
5. **UX**: Loading states, error messages, y feedback visual
6. **Accesibilidad**: Usar componentes de Radix UI que incluyen a11y
7. **Mantenibilidad**: Código modular y bien documentado
8. **Testing**: Preparar código para testing (aunque no implementado aún)

## 🚀 Flujo de Trabajo para Nuevas Features

1. **Generar estructura**: `node scripts/generate-feature.cjs <name>`
2. **Definir tipos**: Crear interfaces en `types/[feature].ts`
3. **Implementar servicio**: Lógica de negocio en `services/[feature]Service.ts`
4. **Crear hooks**: Lógica de estado en `hooks/use[Feature].ts`
5. **Desarrollar componentes**: UI en `components/`
6. **Crear página**: Componente principal en `pages/[Feature].tsx`
7. **Agregar rutas**: En `src/App.tsx`
8. **Actualizar navegación**: Si es necesario
9. **Verificar calidad**: `npm run code-quality`

## 📚 Recursos Adicionales

- [Supabase Docs](https://supabase.com/docs)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

_Estas instrucciones se actualizan automáticamente con el proyecto. Mantener sincronizado con las mejores prácticas del equipo._
