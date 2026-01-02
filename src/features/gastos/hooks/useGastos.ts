import { useState, useEffect } from "react";
import { gastosService } from "../services/gastosService";
import type { Gastos } from "@/services/types";

export const useGastos = () => {
  const [gastoss, setGastoss] = useState<Gastos[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGastoss = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await gastosService.getGastoss();
      if (response.error) {
        setError(response.error);
      } else {
        setGastoss(response.data);
      }
    } catch {
      setError("Error al cargar gastoss");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGastoss();
  }, []);

  return {
    gastoss,
    loading,
    error,
    refetch: fetchGastoss,
  };
};
