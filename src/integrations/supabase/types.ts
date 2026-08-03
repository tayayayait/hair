export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string;
          display_name: string;
          is_active: boolean;
          role: string;
          store_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          is_active?: boolean;
          role?: string;
          store_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          is_active?: boolean;
          role?: string;
          store_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_profiles_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      designers: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          level: string;
          name: string;
          store_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          level?: string;
          name: string;
          store_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          level?: string;
          name?: string;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "designers_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      kiosk_sessions: {
        Row: {
          created_at: string;
          created_by: string;
          designer_id: string;
          ended_at: string | null;
          expires_at: string;
          id: string;
          store_id: string;
          survey_config_snapshot: Json;
          survey_version: string;
          token_hash: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          designer_id: string;
          ended_at?: string | null;
          expires_at?: string;
          id?: string;
          store_id: string;
          survey_config_snapshot?: Json;
          survey_version?: string;
          token_hash: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          designer_id?: string;
          ended_at?: string | null;
          expires_at?: string;
          id?: string;
          store_id?: string;
          survey_config_snapshot?: Json;
          survey_version?: string;
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kiosk_sessions_designer_store_fkey";
            columns: ["designer_id", "store_id"];
            isOneToOne: false;
            referencedRelation: "designers";
            referencedColumns: ["id", "store_id"];
          },
          {
            foreignKeyName: "kiosk_sessions_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      survey_form_configs: {
        Row: {
          config: Json;
          id: string;
          revision: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          config: Json;
          id?: string;
          revision?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          config?: Json;
          id?: string;
          revision?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      survey_responses: {
        Row: {
          address: string | null;
          age_14_or_over: string;
          answers_snapshot: Json;
          birth_date: string | null;
          created_at: string;
          customer_name: string;
          designer_id: string | null;
          designer_name_snapshot: string;
          desired_image: string[];
          gender: string | null;
          guardian_consent_at: string | null;
          guardian_name: string | null;
          guardian_phone: string | null;
          guardian_relationship: string | null;
          hair_concerns: string[];
          homecare_purchase_history: string[];
          id: string;
          interested_services: string[];
          idempotency_key: string | null;
          introducer_name: string | null;
          kiosk_session_id: string | null;
          phone: string;
          preferred_designer_level: string | null;
          priority_points: string[];
          privacy_consent_at: string;
          privacy_consent_version: string;
          scalp_concerns: string[];
          status: string;
          store_id: string;
          store_name_snapshot: string;
          style_photo_plan: string | null;
          submitted_at: string;
          survey_version: string;
          visit_source: string[];
        };
        Insert: {
          address?: string | null;
          age_14_or_over: string;
          answers_snapshot?: Json;
          birth_date?: string | null;
          created_at?: string;
          customer_name: string;
          designer_id?: string | null;
          designer_name_snapshot: string;
          desired_image?: string[];
          gender?: string | null;
          guardian_consent_at?: string | null;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          guardian_relationship?: string | null;
          hair_concerns?: string[];
          homecare_purchase_history?: string[];
          id?: string;
          interested_services?: string[];
          idempotency_key?: string | null;
          introducer_name?: string | null;
          kiosk_session_id?: string | null;
          phone: string;
          preferred_designer_level?: string | null;
          priority_points?: string[];
          privacy_consent_at: string;
          privacy_consent_version: string;
          scalp_concerns?: string[];
          status?: string;
          store_id: string;
          store_name_snapshot: string;
          style_photo_plan?: string | null;
          submitted_at?: string;
          survey_version?: string;
          visit_source?: string[];
        };
        Update: {
          address?: string | null;
          age_14_or_over?: string;
          answers_snapshot?: Json;
          birth_date?: string | null;
          created_at?: string;
          customer_name?: string;
          designer_id?: string | null;
          designer_name_snapshot?: string;
          desired_image?: string[];
          gender?: string | null;
          guardian_consent_at?: string | null;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          guardian_relationship?: string | null;
          hair_concerns?: string[];
          homecare_purchase_history?: string[];
          id?: string;
          interested_services?: string[];
          idempotency_key?: string | null;
          introducer_name?: string | null;
          kiosk_session_id?: string | null;
          phone?: string;
          preferred_designer_level?: string | null;
          priority_points?: string[];
          privacy_consent_at?: string;
          privacy_consent_version?: string;
          scalp_concerns?: string[];
          status?: string;
          store_id?: string;
          store_name_snapshot?: string;
          style_photo_plan?: string | null;
          submitted_at?: string;
          survey_version?: string;
          visit_source?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "survey_responses_designer_id_fkey";
            columns: ["designer_id"];
            isOneToOne: false;
            referencedRelation: "designers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "survey_responses_kiosk_session_id_fkey";
            columns: ["kiosk_session_id"];
            isOneToOne: false;
            referencedRelation: "kiosk_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "survey_responses_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_kiosk_session: {
        Args: {
          p_designer_id: string;
          p_expires_in_minutes?: number;
          p_store_id: string;
        };
        Returns: {
          expires_at: string;
          kiosk_token: string;
          session_id: string;
        }[];
      };
      end_kiosk_session: {
        Args: { p_session_id: string };
        Returns: boolean;
      };
      get_kiosk_context: {
        Args: { p_kiosk_token: string };
        Returns: {
          designer_name: string;
          expires_at: string;
          store_name: string;
          survey_config: Json;
          survey_version: string;
        }[];
      };
      save_survey_form_config: {
        Args: {
          p_config: Json;
          p_expected_revision: number;
        };
        Returns: {
          config: Json;
          revision: number;
        }[];
      };
      submit_survey_response: {
        Args: {
          p_idempotency_key: string;
          p_kiosk_token: string;
          p_payload: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
