import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const GastosComponent: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Contenido del componente Gastos</p>
      </CardContent>
    </Card>
  );
};
