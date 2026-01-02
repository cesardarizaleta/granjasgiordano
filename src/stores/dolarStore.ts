import { create } from "zustand";
import { dolarService, type DolarData } from "@/services";

interface DolarState {
  rates: DolarData[] | null;
  oficialRate: number | null;
  loading: boolean;
  error: string | null;
  showInUSD: boolean;
  refreshRates: () => Promise<void>;
  convertToUSD: (amount: number) => number;
  convertFromUSD: (amount: number) => number;
  setShowInUSD: (show: boolean) => void;
  startAutoRefresh: () => () => void; // Retorna función de limpieza
}

export const useDolarStore = create<DolarState>((set, get) => {
  const loadRates = async () => {
    try {
      set({ loading: true, error: null });
      const response = await dolarService.getDolarRates();
      if (response.error) {
        set({ error: response.error, loading: false });
      } else {
        const rates = response.data;
        const oficialRate = rates ? dolarService.getOficialRate(rates) : null;
        set({ rates, oficialRate, loading: false });
      }
    } catch {
      set({ error: "Error al cargar tasas de dólar", loading: false });
    }
  };

  const startAutoRefresh = () => {
    // Cargar inmediatamente
    loadRates();
    // Configurar intervalo de 5 minutos
    const interval = setInterval(loadRates, 5 * 60 * 1000);
    // Retornar función de limpieza
    return () => clearInterval(interval);
  };

  return {
    rates: null,
    oficialRate: null,
    loading: true,
    error: null,
    showInUSD: true,
    refreshRates: loadRates,
    convertToUSD: (amount: number) => {
      const { oficialRate } = get();
      return oficialRate ? amount / oficialRate : amount;
    },
    convertFromUSD: (amount: number) => {
      const { oficialRate } = get();
      return oficialRate ? amount * oficialRate : amount;
    },
    setShowInUSD: (show: boolean) => set({ showInUSD: show }),
    startAutoRefresh,
  };
});
