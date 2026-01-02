import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface {{Name}}ComponentProps {
  // Define props aquí
}

export const {{Name}}Component: React.FC<{{Name}}ComponentProps> = ({}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{{Name}}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Contenido del componente {{Name}}</p>
      </CardContent>
    </Card>
  );
};