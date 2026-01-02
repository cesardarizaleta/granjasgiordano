import type { Cliente, Producto, Venta, Cobranza } from "@/services/types";

/**
 * Interfaces para la capa de repositorios
 * Separan la lógica de dominio de la implementación de infraestructura
 */

export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export interface SearchOptions {
  query: string;
  page?: number;
  limit?: number;
}

export interface RepositoryResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedRepositoryResponse<T> {
  data: T[];
  count: number;
  error: string | null;
}

// Interfaces de repositorios
export interface IClienteRepository {
  getAll(options: PaginationOptions): Promise<PaginatedRepositoryResponse<Cliente>>;
  getById(id: string): Promise<RepositoryResponse<Cliente>>;
  create(cliente: Omit<Cliente, "id" | "fecha_creacion">): Promise<RepositoryResponse<Cliente>>;
  update(id: string, cliente: Partial<Cliente>): Promise<RepositoryResponse<Cliente>>;
  delete(id: string): Promise<RepositoryResponse<null>>;
  search(options: SearchOptions): Promise<PaginatedRepositoryResponse<Cliente>>;
}

export interface IProductoRepository {
  getAll(options: PaginationOptions): Promise<PaginatedRepositoryResponse<Producto>>;
  getById(id: string): Promise<RepositoryResponse<Producto>>;
  create(producto: Omit<Producto, "id" | "fecha_creacion">): Promise<RepositoryResponse<Producto>>;
  update(id: string, producto: Partial<Producto>): Promise<RepositoryResponse<Producto>>;
  delete(id: string): Promise<RepositoryResponse<null>>;
  search(options: SearchOptions): Promise<PaginatedRepositoryResponse<Producto>>;
}

export interface IVentaRepository {
  getAll(options: PaginationOptions): Promise<PaginatedRepositoryResponse<Venta>>;
  getById(id: string): Promise<RepositoryResponse<Venta>>;
  create(venta: Omit<Venta, "id" | "fecha_venta">): Promise<RepositoryResponse<Venta>>;
  update(id: string, venta: Partial<Venta>): Promise<RepositoryResponse<Venta>>;
  delete(id: string): Promise<RepositoryResponse<null>>;
  getByCliente(clienteId: string): Promise<PaginatedRepositoryResponse<Venta>>;
}

export interface ICobranzaRepository {
  getAll(options: PaginationOptions): Promise<PaginatedRepositoryResponse<Cobranza>>;
  getById(id: string): Promise<RepositoryResponse<Cobranza>>;
  create(cobranza: Omit<Cobranza, "id">): Promise<RepositoryResponse<Cobranza>>;
  update(id: string, cobranza: Partial<Cobranza>): Promise<RepositoryResponse<Cobranza>>;
  delete(id: string): Promise<RepositoryResponse<null>>;
  getByVenta(ventaId: string): Promise<PaginatedRepositoryResponse<Cobranza>>;
}
