import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { dolarService, type DolarData } from "@/services";

interface DolarContextType {
  rates: DolarData[] | null;
  oficialRate: number | null;
  loading: boolean;
  error: string | null;
  refreshRates: () => Promise<void>;
  convertToUSD: (amount: number) => number;
  convertFromUSD: (amount: number) => number;
  showInUSD: boolean;
  setShowInUSD: (show: boolean) => void;
}

const DolarContext = createContext<DolarContextType | undefined>(undefined);

interface DolarProviderProps {
  children: ReactNode;
}

export function DolarProvider({ children }: DolarProviderProps) {
  const [rates, setRates] = useState<DolarData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInUSD, setShowInUSD] = useState(true); // Default activado

  const loadRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dolarService.getDolarRates();
      if (response.error) {
        setError(response.error);
      } else {
        setRates(response.data);
      }
    } catch {
      setError("Error al cargar tasas de dólar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
    // Refresh every 5 minutes
    const interval = setInterval(loadRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const oficialRate = rates ? dolarService.getOficialRate(rates) : null;

  const convertToUSD = (amount: number): number => {
    return oficialRate ? amount / oficialRate : amount;
  };

  const convertFromUSD = (amount: number): number => {
    return oficialRate ? amount * oficialRate : amount;
  };

  const refreshRates = async () => {
    await loadRates();
  };

  const value: DolarContextType = {
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

  return <DolarContext.Provider value={value}>{children}</DolarContext.Provider>;
}

export function useDolar() {
  const context = useContext(DolarContext);
  if (context === undefined) {
    throw new Error("useDolar must be used within a DolarProvider");
  }
  return context;
}
