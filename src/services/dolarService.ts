import type { ApiResponse } from "./types";

export interface DolarData {
  fuente: string;
  nombre: string;
  compra: number | null;
  venta: number | null;
  promedio: number;
  fechaActualizacion: string;
}

class DolarService {
  private readonly API_URL = "https://ve.dolarapi.com/v1/dolares";

  async getDolarRates(): Promise<ApiResponse<DolarData[]>> {
    try {
      const response = await fetch(this.API_URL);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data: DolarData[] = await response.json();
      return { data, error: null };
    } catch (err) {
      console.error("Error fetching dolar rates:", err);
      return { data: null, error: "Error al obtener tasas de dólar" };
    }
  }

  // Obtener el promedio del dólar oficial
  getOficialRate(rates: DolarData[]): number | null {
    const oficial = rates.find(rate => rate.fuente === "oficial");
    return oficial ? oficial.promedio : null;
  }
}

export const dolarService = new DolarService();
