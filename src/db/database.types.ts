export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      decks: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      flashcards: {
        Row: {
          back: string;
          created_at: string;
          deck_id: string;
          difficulty: number | null;
          elapsed_days: number | null;
          front: string;
          id: string;
          lapses: number | null;
          last_review: string | null;
          next_review: string;
          reps: number | null;
          scheduled_days: number | null;
          source: Database["public"]["Enums"]["source_type"];
          stability: number | null;
          state: number | null;
          updated_at: string;
        };
        Insert: {
          back: string;
          created_at?: string;
          deck_id: string;
          difficulty?: number | null;
          elapsed_days?: number | null;
          front: string;
          id?: string;
          lapses?: number | null;
          last_review?: string | null;
          next_review?: string;
          reps?: number | null;
          scheduled_days?: number | null;
          source: Database["public"]["Enums"]["source_type"];
          stability?: number | null;
          state?: number | null;
          updated_at?: string;
        };
        Update: {
          back?: string;
          created_at?: string;
          deck_id?: string;
          difficulty?: number | null;
          elapsed_days?: number | null;
          front?: string;
          id?: string;
          lapses?: number | null;
          last_review?: string | null;
          next_review?: string;
          reps?: number | null;
          scheduled_days?: number | null;
          source?: Database["public"]["Enums"]["source_type"];
          stability?: number | null;
          state?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "decks";
            referencedColumns: ["id"];
          },
        ];
      };
      generation_events: {
        Row: {
          created_at: string;
          event_type: Database["public"]["Enums"]["event_type"];
          flashcard_id: string | null;
          generation_id: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: Database["public"]["Enums"]["event_type"];
          flashcard_id?: string | null;
          generation_id?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: Database["public"]["Enums"]["event_type"];
          flashcard_id?: string | null;
          generation_id?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generation_events_flashcard_id_fkey";
            columns: ["flashcard_id"];
            isOneToOne: false;
            referencedRelation: "flashcards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generation_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      profiles: {
        Row: {
          ai_limit_reset_date: string;
          created_at: string;
          monthly_ai_flashcards_count: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_limit_reset_date?: string;
          created_at?: string;
          monthly_ai_flashcards_count?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ai_limit_reset_date?: string;
          created_at?: string;
          monthly_ai_flashcards_count?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      event_type: "GENERATED" | "ACCEPTED" | "REJECTED" | "EDITED";
      source_type: "ai" | "manual";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      event_type: ["GENERATED", "ACCEPTED", "REJECTED", "EDITED"],
      source_type: ["ai", "manual"],
    },
  },
} as const;
