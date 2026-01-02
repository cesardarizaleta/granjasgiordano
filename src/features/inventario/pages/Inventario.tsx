import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import { useConfirm } from "@/hooks/useConfirm";
import { SimplePagination } from "@/components/SimplePagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, Package, Loader2 } from "lucide-react";
import { MODULE_CONFIG } from "@/constants";
import { inventarioService } from "@/services";
import { supabase } from "@/integrations/supabase/client";
import { useInventarioStore } from "@/stores/inventarioStore";
import type { Producto } from "@/services";

type Product = Producto;

const Inventario = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = MODULE_CONFIG.inventario.pageSize;

  const { formatPrice } = usePriceFormatter();
  const { confirm, ConfirmDialog } = useConfirm();

  // Store de inventario para sincronización en tiempo real
  const storeProductos = useInventarioStore(state => state.productos);
  const setStoreProductos = useInventarioStore(state => state.setProductos);
  const addProductoToStore = useInventarioStore(state => state.addProducto);
  const updateProductoInStore = useInventarioStore(state => state.updateProducto);
  const removeProductoFromStore = useInventarioStore(state => state.removeProducto);

  useEffect(() => {
    checkAuthAndLoadProducts();
  }, [currentPage]);

  // Sincronizar productos del store cuando cambian (actualizaciones en tiempo real)
  // Nota: El store mantiene todos los productos, pero aquí usamos paginación del servidor
  // Por lo tanto, solo sincronizamos cuando hay cambios específicos en productos que ya tenemos
  useEffect(() => {
    if (storeProductos.length > 0 && products.length > 0) {
      // Buscar productos actualizados en el store que están en la página actual
      const updatedProducts = products.map(localProduct => {
        const storeProduct = storeProductos.find(sp => sp.id === localProduct.id);
        return storeProduct || localProduct;
      });

      // Solo actualizar si hay cambios
      const hasChanges = updatedProducts.some(
        (up, index) => JSON.stringify(up) !== JSON.stringify(products[index])
      );

      if (hasChanges) {
        setProducts(updatedProducts);
      }
    }
  }, [storeProductos]);

  const checkAuthAndLoadProducts = async () => {
    try {
      // Verificar si el usuario está autenticado
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setIsAuthenticated(false);
        setLoading(false);
        setError("Debes iniciar sesión para acceder al inventario");
        return;
      }

      setIsAuthenticated(true);
      await loadProducts();
    } catch (err) {
      console.error("Auth check error:", err);
      setIsAuthenticated(false);
      setError("Error al verificar autenticación");
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar productos usando el servicio con paginación
      const response = await inventarioService.getProductos(currentPage, pageSize);
      if (response.error) {
        // Si es un error de "no hay productos", no mostrar como error
        if (
          response.error.includes("No data") ||
          response.error.includes("empty") ||
          response.data?.length === 0
        ) {
          setProducts([]);
        } else {
          console.error("Service error:", response.error);
          setError(response.error);
        }
      } else {
        const loadedProducts = response.data || [];
        setProducts(loadedProducts);
        setTotalPages(Math.ceil(response.count / pageSize));

        // Sincronizar con el store
        setStoreProductos(loadedProducts);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Error al conectar con la base de datos");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Obtener el usuario actual
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setError("Debes iniciar sesión para crear productos");
      return;
    }

    const productData = {
      nombre_producto: formData.get("nombre") as string,
      descripcion: formData.get("descripcion") as string,
      precio: Number(formData.get("precio")),
      stock: Number(formData.get("stock")),
      categoria: formData.get("categoria") as string,
      peso: formData.get("peso") ? Number(formData.get("peso")) : null,
      fecha_creacion: new Date().toISOString(),
      user_id: session.user.id,
    };

    try {
      if (editingProduct) {
        const response = await inventarioService.updateProducto(editingProduct.id, productData);
        if (response.error) {
          setError(response.error);
        } else {
          const updatedProduct = { ...editingProduct, ...productData };
          setProducts(products.map(p => (p.id === editingProduct.id ? updatedProduct : p)));
          // Actualizar en el store (la suscripción en tiempo real también lo hará, pero esto es más inmediato)
          updateProductoInStore(editingProduct.id, productData);
        }
      } else {
        const response = await inventarioService.createProducto(productData);
        if (response.error) {
          setError(response.error);
        } else {
          const newProduct = response.data!;
          setProducts([...products, newProduct]);
          // Agregar al store (la suscripción en tiempo real también lo hará, pero esto es más inmediato)
          addProductoToStore(newProduct);
        }
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
    } catch {
      setError("Error al guardar producto");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Eliminar Producto",
      description:
        "¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.",
    });
    if (!confirmed) return;

    try {
      const response = await inventarioService.deleteProducto(id);
      if (response.error) {
        setError(response.error);
      } else {
        setProducts(products.filter(p => p.id !== id));
        // Eliminar del store (la suscripción en tiempo real también lo hará, pero esto es más inmediato)
        removeProductoFromStore(id);
      }
    } catch {
      setError("Error al eliminar producto");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Inventario</h1>
            <p className="text-muted-foreground">Gestión de productos y stock</p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={open => {
              setIsDialogOpen(open);
              if (!open) setEditingProduct(null);
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingProduct ? "Editar Producto" : "Agregar Producto"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Producto</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      defaultValue={editingProduct?.nombre_producto}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Input
                      id="categoria"
                      name="categoria"
                      defaultValue={editingProduct?.categoria}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Actual</Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      defaultValue={editingProduct?.stock}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precio">Precio ($)</Label>
                    <Input
                      id="precio"
                      name="precio"
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct?.precio}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="peso">Peso (kg) - Opcional</Label>
                    <Input
                      id="peso"
                      name="peso"
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct?.peso || ""}
                      placeholder="Ej: 1.5"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Input
                      id="descripcion"
                      name="descripcion"
                      defaultValue={editingProduct?.descripcion}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {editingProduct ? "Guardar Cambios" : "Agregar Producto"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-4 py-2">
              <Package className="w-4 h-4 mr-2" />
              {products.length} productos
            </Badge>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-destructive text-sm">{error}</p>
            {error.includes("autenticación") || error.includes("sesión") ? (
              <p className="text-sm text-muted-foreground mt-2">
                Ve a la página de{" "}
                <a href="/login" className="text-primary hover:underline">
                  inicio de sesión
                </a>{" "}
                para acceder.
              </p>
            ) : null}
          </div>
        )}

        {/* Loading or Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Cargando productos...</span>
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Acceso requerido</h3>
            <p className="text-muted-foreground">Debes iniciar sesión para ver el inventario.</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm animate-slide-up overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Producto</TableHead>
                  <TableHead className="min-w-[120px]">Categoría</TableHead>
                  <TableHead className="min-w-[100px]">Stock</TableHead>
                  <TableHead className="min-w-[100px]">Peso (kg)</TableHead>
                  <TableHead className="min-w-[100px]">Precio</TableHead>
                  <TableHead className="min-w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Cargando productos...
                        </div>
                      ) : error ? (
                        <div className="text-destructive">{error}</div>
                      ) : (
                        "No hay productos registrados. ¡Agrega el primero!"
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map(product => (
                    <TableRow key={product.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{product.nombre_producto}</TableCell>
                      <TableCell>{product.categoria || "Sin categoría"}</TableCell>
                      <TableCell>{product.stock.toLocaleString()}</TableCell>
                      <TableCell>{product.peso ? `${product.peso} kg` : "N/A"}</TableCell>
                      <TableCell>{formatPrice(product.precio, "USD")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          loading={loading}
        />
      </div>
      {ConfirmDialog}
    </MainLayout>
  );
};

export default Inventario;
