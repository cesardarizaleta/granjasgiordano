# Carbon Zulianita ERP

![Inventario](public/inventory.png)

Una suite completa de gestión empresarial diseñada para pequeñas y medianas empresas. Gestiona inventarios, ventas, clientes y cobranzas de manera eficiente y moderna.

## 🚀 Características

- **Gestión de Inventario**: Controla productos, stock, categorías y alertas de stock bajo.
- **Ventas**: Registra ventas con detalles de productos, calcula totales automáticamente.
- **Clientes**: Mantén un registro completo de clientes con información de contacto.
- **Cobranza**: Gestiona pagos pendientes, fechas de vencimiento y estados de cobranza.
- **Dashboard**: Visualiza estadísticas clave con gráficos y reportes en tiempo real.
- **Autenticación**: Sistema seguro de login/registro con roles (admin, vendedor, cobrador).
- **Interfaz Moderna**: UI responsiva y amigable con Tailwind CSS y shadcn-ui.

## 🛠 Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI/UX**: Tailwind CSS, shadcn-ui, Lucide Icons
- **Estado y API**: Servicios desacoplados para fácil migración
- **Despliegue**: Compatible con Vercel, Netlify, o cualquier plataforma que soporte Vite

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ y npm
- Cuenta en [Supabase](https://supabase.com)

### Pasos de Instalación

1. **Clona el repositorio**:

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd carbon-zulianita-suite
   ```

2. **Instala dependencias**:

   ```bash
   npm install
   ```

3. **Configura variables de entorno**:
   Crea un archivo `.env` en la raíz del proyecto con:

   ```env
   VITE_SUPABASE_PROJECT_ID=tu_project_id
   VITE_SUPABASE_PUBLISHABLE_KEY=tu_clave_anonima
   VITE_SUPABASE_URL=https://tu-project-id.supabase.co
   VITE_DATABASE_URL=postgresql://postgres:tu_password@db.tu-project-id.supabase.co:5432/postgres
   ```

4. **Configura Supabase**:
   - Crea un proyecto en Supabase.
   - Ejecuta el SQL para crear tablas (ver sección Configuración).
   - Obtén la clave anónima del dashboard de Supabase.

5. **Ejecuta el proyecto**:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## ⚙️ Configuración de Supabase

### Crear Tablas

Ejecuta este SQL en el **SQL Editor** de Supabase:

```sql
-- Tabla para clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabla para inventario (productos)
CREATE TABLE inventario (
    id SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    precio_bs DECIMAL(10, 2),
    stock INTEGER NOT NULL DEFAULT 0,
    categoria VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabla para ventas
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    fecha_venta TIMESTAMP DEFAULT NOW(),
    total DECIMAL(10, 2) NOT NULL,
    total_bs DECIMAL(10, 2),
    tasa_cambio_aplicada DECIMAL(10, 2),
    estado VARCHAR(50) DEFAULT 'completada',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabla para items de venta
CREATE TABLE venta_items (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES inventario(id) ON DELETE SET NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    precio_unitario_bs DECIMAL(10, 2),
    subtotal DECIMAL(10, 2) NOT NULL,
    subtotal_bs DECIMAL(10, 2)
);

-- Tabla para cobranza
CREATE TABLE cobranza (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER REFERENCES ventas(id) ON DELETE CASCADE,
    monto_pendiente DECIMAL(10, 2) NOT NULL,
    fecha_vencimiento DATE,
    estado VARCHAR(50) DEFAULT 'pendiente',
    notas TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para rendimiento
CREATE INDEX idx_clientes_user_id ON clientes(user_id);
CREATE INDEX idx_inventario_user_id ON inventario(user_id);
CREATE INDEX idx_ventas_user_id ON ventas(user_id);
CREATE INDEX idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX idx_venta_items_venta_id ON venta_items(venta_id);
CREATE INDEX idx_cobranza_venta_id ON cobranza(venta_id);
CREATE INDEX idx_cobranza_user_id ON cobranza(user_id);
```

### Configurar Seguridad

- Ve a **Authentication > Policies** en Supabase.
- Crea políticas RLS para cada tabla, permitiendo acceso solo a registros del usuario autenticado (ej. `user_id = auth.uid()`).

### Generar Tipos

- Una vez creadas las tablas, ve a **Settings > API > Generate types** para actualizar los tipos TypeScript.

## 📖 Uso

### Navegación

- **Dashboard**: Vista general con estadísticas.
- **Inventario**: Agrega/edita productos.
- **Ventas**: Registra nuevas ventas.
- **Clientes**: Gestiona base de clientes.
- **Cobranza**: Monitorea pagos pendientes.
- **Configuración**: Ajustes del sistema.

### API Services

Los servicios están desacoplados para fácil migración:

- `clienteService`: CRUD de clientes.
- `inventarioService`: Gestión de productos.
- `ventaService`: Operaciones de ventas.
- `cobranzaService`: Manejo de cobranzas.
- `authService`: Autenticación.

Ejemplo de uso:

```typescript
import { clienteService } from "@/services";

const clientes = await clienteService.getClientes();
```

## 🛠 Desarrollo

### Formateo de Código

Este proyecto utiliza **Prettier** para mantener un estilo de código consistente.

```bash
# Formatear todos los archivos
npm run format

# Verificar formato sin modificar archivos
npm run format:check
```

### Linting

Usamos ESLint integrado con Prettier para mantener la calidad del código.

```bash
# Ejecutar linting
npm run lint
```

### Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Vista previa de la build de producción
- `npm run lint` - Ejecuta ESLint
- `npm run format` - Formatea el código con Prettier
- `npm run format:check` - Verifica el formato del código

## 🤝 Contribución

1. Fork el proyecto.
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`).
4. Push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

Para preguntas o soporte, contacta al equipo de desarrollo.

---

¡Gracias por usar Carbon Zulianita Suite! 🚀
