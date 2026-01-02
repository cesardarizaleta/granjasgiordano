export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      inventario: {
        Row: {
          id: string;
          nombre_producto: string;
          descripcion: string | null;
          precio: number;
          precio_bs: number;
          stock: number;
          categoria: string | null;
          fecha_creacion: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          nombre_producto: string;
          descripcion?: string | null;
          precio: number;
          precio_bs?: number;
          stock: number;
          categoria?: string | null;
          fecha_creacion?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          nombre_producto?: string;
          descripcion?: string | null;
          precio?: number;
          precio_bs?: number;
          stock?: number;
          categoria?: string | null;
          fecha_creacion?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ventas: {
        Row: {
          id: string;
          cliente_id: string | null;
          total: number;
          total_bs: number;
          tasa_cambio_aplicada: number;
          fecha_venta: string;
          estado: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cliente_id?: string | null;
          total: number;
          total_bs?: number;
          tasa_cambio_aplicada?: number;
          fecha_venta: string;
          estado: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string | null;
          total?: number;
          total_bs?: number;
          tasa_cambio_aplicada?: number;
          fecha_venta?: string;
          estado?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ventas_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      clientes: {
        Row: {
          id: string;
          nombre: string;
          email: string | null;
          telefono: string | null;
          direccion: string | null;
          fecha_creacion: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          email?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          fecha_creacion?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          email?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          fecha_creacion?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      cobranza: {
        Row: {
          id: string;
          venta_id: string;
          monto_pendiente: number;
          fecha_vencimiento: string | null;
          estado: string;
          notas: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          venta_id: string;
          monto_pendiente: number;
          fecha_vencimiento?: string | null;
          estado: string;
          notas?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          venta_id?: string;
          monto_pendiente?: number;
          fecha_vencimiento?: string | null;
          estado?: string;
          notas?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cobranza_venta_id_fkey";
            columns: ["venta_id"];
            isOneToOne: false;
            referencedRelation: "ventas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_role: "admin" | "vendedor" | "cobrador";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;
