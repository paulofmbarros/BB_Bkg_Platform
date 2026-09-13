export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          blocked_until: string
          created_at: string
          customer_id: string
          ends_at: string
          id: string
          location_id: string
          price_minor: number
          service_id: string
          service_name: string
          staff_id: string
          starts_at: string
          status: string
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          blocked_until: string
          created_at?: string
          customer_id: string
          ends_at: string
          id?: string
          location_id: string
          price_minor: number
          service_id: string
          service_name: string
          staff_id: string
          starts_at: string
          status?: string
          tenant_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          blocked_until?: string
          created_at?: string
          customer_id?: string
          ends_at?: string
          id?: string
          location_id?: string
          price_minor?: number
          service_id?: string
          service_name?: string
          staff_id?: string
          starts_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointments_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summaries"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_location_id_fkey"
            columns: ["tenant_id", "location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_service_id_fkey"
            columns: ["tenant_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_staff_id_fkey"
            columns: ["tenant_id", "staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_id: string | null
          entity_id: string | null
          entity_table: string
          id: number
          occurred_at: string
          operation: string
          tenant_id: string
        }
        Insert: {
          actor_id?: string | null
          entity_id?: string | null
          entity_table: string
          id?: never
          occurred_at?: string
          operation: string
          tenant_id: string
        }
        Update: {
          actor_id?: string | null
          entity_id?: string | null
          entity_table?: string
          id?: never
          occurred_at?: string
          operation?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_exceptions: {
        Row: {
          end_date: string
          id: string
          location_id: string
          reason: string
          staff_id: string | null
          start_date: string
          tenant_id: string
        }
        Insert: {
          end_date: string
          id?: string
          location_id: string
          reason: string
          staff_id?: string | null
          start_date: string
          tenant_id: string
        }
        Update: {
          end_date?: string
          id?: string
          location_id?: string
          reason?: string
          staff_id?: string | null
          start_date?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_tenant_id_location_id_fkey"
            columns: ["tenant_id", "location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "availability_exceptions_tenant_id_staff_id_fkey"
            columns: ["tenant_id", "staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      business_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          enabled: boolean
          end_time: string
          location_id: string
          start_time: string
          tenant_id: string
          weekday: number
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          enabled?: boolean
          end_time: string
          location_id: string
          start_time: string
          tenant_id: string
          weekday: number
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          enabled?: boolean
          end_time?: string
          location_id?: string
          start_time?: string
          tenant_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_tenant_id_location_id_fkey"
            columns: ["tenant_id", "location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      customer_links: {
        Row: {
          actor_id: string
          appointment_ids: string[]
          confirmation: string
          created_at: string
          id: string
          source_id: string
          target_id: string
          tenant_id: string
          undone_at: string | null
          undone_by: string | null
        }
        Insert: {
          actor_id: string
          appointment_ids: string[]
          confirmation: string
          created_at?: string
          id?: string
          source_id: string
          target_id: string
          tenant_id: string
          undone_at?: string | null
          undone_by?: string | null
        }
        Update: {
          actor_id?: string
          appointment_ids?: string[]
          confirmation?: string
          created_at?: string
          id?: string
          source_id?: string
          target_id?: string
          tenant_id?: string
          undone_at?: string | null
          undone_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_links_tenant_id_source_id_fkey"
            columns: ["tenant_id", "source_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_links_tenant_id_source_id_fkey"
            columns: ["tenant_id", "source_id"]
            isOneToOne: false
            referencedRelation: "customer_summaries"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_links_tenant_id_source_id_fkey"
            columns: ["tenant_id", "source_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_links_tenant_id_target_id_fkey"
            columns: ["tenant_id", "target_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_links_tenant_id_target_id_fkey"
            columns: ["tenant_id", "target_id"]
            isOneToOne: false
            referencedRelation: "customer_summaries"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_links_tenant_id_target_id_fkey"
            columns: ["tenant_id", "target_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          display_name: string
          email: string
          email_verified: boolean
          id: string
          linked_customer_id: string | null
          marketing_consent: boolean
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          email_verified?: boolean
          id?: string
          linked_customer_id?: string | null
          marketing_consent?: boolean
          tenant_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          email_verified?: boolean
          id?: string
          linked_customer_id?: string | null
          marketing_consent?: boolean
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_link_tenant_fk"
            columns: ["tenant_id", "linked_customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_link_tenant_fk"
            columns: ["tenant_id", "linked_customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summaries"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_link_tenant_fk"
            columns: ["tenant_id", "linked_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_entitlements: {
        Row: {
          enabled: boolean
          feature: string
          tenant_id: string
        }
        Insert: {
          enabled?: boolean
          feature: string
          tenant_id: string
        }
        Update: {
          enabled?: boolean
          feature?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_entitlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          id: string
          name: string
          phone: string
          tenant_id: string
          timezone: string
        }
        Insert: {
          address?: string
          id?: string
          name?: string
          phone?: string
          tenant_id: string
          timezone?: string
        }
        Update: {
          address?: string
          id?: string
          name?: string
          phone?: string
          tenant_id?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_invitations: {
        Row: {
          accepted_at: string | null
          attempt_id: string | null
          attempted_at: string | null
          cancelled_at: string | null
          created_at: string
          created_by: string
          delivery_error: string | null
          delivery_state: string
          email: string
          expires_at: string
          id: string
          sent_at: string | null
          tenant_id: string
        }
        Insert: {
          accepted_at?: string | null
          attempt_id?: string | null
          attempted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by: string
          delivery_error?: string | null
          delivery_state?: string
          email: string
          expires_at?: string
          id?: string
          sent_at?: string | null
          tenant_id: string
        }
        Update: {
          accepted_at?: string | null
          attempt_id?: string | null
          attempted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by?: string
          delivery_error?: string | null
          delivery_state?: string
          email?: string
          expires_at?: string
          id?: string
          sent_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          buffer_minutes: number
          category: string
          created_at: string
          description: string
          duration_minutes: number
          id: string
          name: string
          price_minor: number
          tenant_id: string
        }
        Insert: {
          active?: boolean
          buffer_minutes?: number
          category?: string
          created_at?: string
          description?: string
          duration_minutes: number
          id?: string
          name: string
          price_minor: number
          tenant_id: string
        }
        Update: {
          active?: boolean
          buffer_minutes?: number
          category?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          name?: string
          price_minor?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          active: boolean
          bio: string
          created_at: string
          display_name: string
          id: string
          tenant_id: string
          title: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          bio?: string
          created_at?: string
          display_name: string
          id?: string
          tenant_id: string
          title?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          bio?: string
          created_at?: string
          display_name?: string
          id?: string
          tenant_id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_services: {
        Row: {
          service_id: string
          staff_id: string
          tenant_id: string
        }
        Insert: {
          service_id: string
          staff_id: string
          tenant_id: string
        }
        Update: {
          service_id?: string
          staff_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_tenant_id_service_id_fkey"
            columns: ["tenant_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "staff_services_tenant_id_staff_id_fkey"
            columns: ["tenant_id", "staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      staff_working_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          enabled: boolean
          end_time: string
          staff_id: string
          start_time: string
          tenant_id: string
          weekday: number
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          enabled?: boolean
          end_time: string
          staff_id: string
          start_time: string
          tenant_id: string
          weekday: number
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          enabled?: boolean
          end_time?: string
          staff_id?: string
          start_time?: string
          tenant_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_working_hours_tenant_id_staff_id_fkey"
            columns: ["tenant_id", "staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      tenant_branding: {
        Row: {
          accent_color: string
          description: string
          logo_path: string | null
          tagline: string
          tenant_id: string
        }
        Insert: {
          accent_color?: string
          description?: string
          logo_path?: string | null
          tagline?: string
          tenant_id: string
        }
        Update: {
          accent_color?: string
          description?: string
          logo_path?: string | null
          tagline?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_branding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_domains: {
        Row: {
          hostname: string
          is_primary: boolean
          tenant_id: string
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          hostname: string
          is_primary?: boolean
          tenant_id: string
          verification_token?: string
          verified_at?: string | null
        }
        Update: {
          hostname?: string
          is_primary?: boolean
          tenant_id?: string
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_memberships: {
        Row: {
          active: boolean
          role: Database["public"]["Enums"]["member_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          role: Database["public"]["Enums"]["member_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          role?: Database["public"]["Enums"]["member_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          id: string
          is_demo: boolean
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      customer_segments: {
        Row: {
          appointment_count: number | null
          average_visit_minor: number | null
          awaiting_outcome: number | null
          cancellations: number | null
          completed_value_minor: number | null
          completed_visits: number | null
          created_at: string | null
          days_since_visit: number | null
          display_name: string | null
          duplicate_records: number | null
          email: string | null
          email_verified: boolean | null
          history_revision: string | null
          id: string | null
          last_visit_at: string | null
          marketing_consent: boolean | null
          next_visit_at: string | null
          no_shows: number | null
          search_text: string | null
          segment: string | null
          tenant_id: string | null
          upcoming_visits: number | null
          updated_at: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_summaries: {
        Row: {
          appointment_count: number | null
          average_visit_minor: number | null
          awaiting_outcome: number | null
          cancellations: number | null
          completed_value_minor: number | null
          completed_visits: number | null
          created_at: string | null
          display_name: string | null
          email: string | null
          email_verified: boolean | null
          history_revision: string | null
          id: string | null
          last_visit_at: string | null
          marketing_consent: boolean | null
          next_visit_at: string | null
          no_shows: number | null
          search_text: string | null
          tenant_id: string | null
          upcoming_visits: number | null
          updated_at: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_platform_invitation: { Args: { p_id: string }; Returns: string }
      booking_slots: {
        Args: {
          p_day: string
          p_host: string
          p_service: string
          p_staff: string
        }
        Returns: Json
      }
      claim_platform_invitation: {
        Args: { p_actor: string; p_id: string }
        Returns: Json
      }
      create_booking: {
        Args: {
          p_email: string
          p_host: string
          p_name: string
          p_quote?: Json
          p_service: string
          p_staff: string
          p_start: string
          p_token: string
        }
        Returns: string
      }
      customer_segment_counts: {
        Args: { p_query?: string; p_tenant: string }
        Returns: Json
      }
      get_public_shop: { Args: { p_hostname: string }; Returns: Json }
      is_platform_admin: { Args: never; Returns: boolean }
      link_customers: {
        Args: {
          p_confirmation: string
          p_source: string
          p_source_revision: string
          p_source_version: number
          p_target: string
          p_target_revision: string
          p_target_version: number
          p_tenant: string
        }
        Returns: string
      }
      manage_booking: {
        Args: {
          p_action?: string
          p_host: string
          p_start?: string
          p_token: string
          p_version?: number
        }
        Returns: Json
      }
      owner_booking_change: {
        Args: {
          p_action: string
          p_id: string
          p_start?: string
          p_tenant: string
          p_version: number
        }
        Returns: undefined
      }
      owner_booking_slots: {
        Args: {
          p_day: string
          p_service: string
          p_staff: string
          p_tenant: string
        }
        Returns: Json
      }
      platform_clients: { Args: { p_id?: string }; Returns: Json }
      platform_mutate: {
        Args: { p_action: string; p_payload: Json; p_tenant: string }
        Returns: string
      }
      rebook_customer: {
        Args: {
          p_customer: string
          p_customer_version: number
          p_duration: number
          p_price: number
          p_request: string
          p_service: string
          p_staff: string
          p_start: string
          p_tenant: string
        }
        Returns: string
      }
      save_branding: {
        Args: {
          p_accent: string
          p_address: string
          p_description: string
          p_name: string
          p_phone: string
          p_tagline: string
          p_tenant: string
        }
        Returns: undefined
      }
      save_hours: {
        Args: {
          p_rows: Json
          p_staff: boolean
          p_subject: string
          p_tenant: string
        }
        Returns: undefined
      }
      save_staff: {
        Args: {
          p_active: boolean
          p_bio: string
          p_id: string
          p_name: string
          p_services: string[]
          p_tenant: string
          p_title: string
        }
        Returns: string
      }
      undo_customer_link: {
        Args: { p_link: string; p_tenant: string }
        Returns: undefined
      }
      update_customer: {
        Args: {
          p_email: string
          p_id: string
          p_name: string
          p_tenant: string
          p_version: number
        }
        Returns: undefined
      }
    }
    Enums: {
      member_role: "owner" | "manager" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      member_role: ["owner", "manager", "staff"],
    },
  },
} as const
