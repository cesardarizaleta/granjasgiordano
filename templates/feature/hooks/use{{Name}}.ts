import { useState, useEffect } from "react";
import { {{name}}Service } from "../services/{{name}}Service";
import type { {{Name}} } from "@/services/types";

export const use{{Name}} = () => {
  const [{{name}}s, set{{Name}}s] = useState<{{Name}}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch{{Name}}s = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await {{name}}Service.get{{Name}}s();
      if (response.error) {
        setError(response.error);
      } else {
        set{{Name}}s(response.data);
      }
    } catch (err) {
      setError("Error al cargar {{name}}s");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch{{Name}}s();
  }, []);

  return {
    {{name}}s,
    loading,
    error,
    refetch: fetch{{Name}}s,
  };
};