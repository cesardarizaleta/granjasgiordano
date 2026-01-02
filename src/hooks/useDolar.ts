// Hook de compatibilidad para mantener el uso existente de useDolar
// Internamente usa el store de Zustand
import { useEffect } from "react";
import { useDolarStore } from "@/stores/dolarStore";

export function useDolar() {
  const {
    rates,
    oficialRate,
    loading,
    error,
    refreshRates,
    convertToUSD,
    convertFromUSD,
    showInUSD,
    setShowInUSD,
    startAutoRefresh,
  } = useDolarStore();

  // Inicializar auto-refresh cuando se monta el componente
  useEffect(() => {
    const cleanup = startAutoRefresh();
    return cleanup;
  }, [startAutoRefresh]);

  return {
    rates,
    oficialRate,
    loading,
    error,
    refreshRates,
    convertToUSD,
    convertFromUSD,
    showInUSD,
    setShowInUSD,
  };
}
