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
      appointment_deposit_payments: {
        Row: {
          amount_minor: number
          appointment_id: string
          created_at: string
          id: string
          paid_at: string | null
          provider: string
          provider_payment_intent: string | null
          provider_reference: string
          refund_reference: string | null
          refunded_at: string | null
          refunded_minor: number
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_minor: number
          appointment_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          provider: string
          provider_payment_intent?: string | null
          provider_reference: string
          refund_reference?: string | null
          refunded_at?: string | null
          refunded_minor?: number
          status: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          appointment_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          provider?: string
          provider_payment_intent?: string | null
          provider_reference?: string
          refund_reference?: string | null
          refunded_at?: string | null
          refunded_minor?: number
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_deposit_payments_tenant_id_appointment_id_fkey"
            columns: ["tenant_id", "appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      appointment_protections: {
        Row: {
          appointment_id: string
          cancellation_deadline: string
          cancellation_window_hours: number
          cancelled_count: number
          completed_count: number
          created_at: string
          deposit_percent: number
          deposit_required_minor: number
          no_show_count: number
          policy_version: number
          reminder_due_at: string
          reminder_lead_hours: number
          risk_level: string
          tenant_id: string
        }
        Insert: {
          appointment_id: string
          cancellation_deadline: string
          cancellation_window_hours: number
          cancelled_count: number
          completed_count: number
          created_at?: string
          deposit_percent: number
          deposit_required_minor: number
          no_show_count: number
          policy_version: number
          reminder_due_at: string
          reminder_lead_hours: number
          risk_level: string
          tenant_id: string
        }
        Update: {
          appointment_id?: string
          cancellation_deadline?: string
          cancellation_window_hours?: number
          cancelled_count?: number
          completed_count?: number
          created_at?: string
          deposit_percent?: number
          deposit_required_minor?: number
          no_show_count?: number
          policy_version?: number
          reminder_due_at?: string
          reminder_lead_hours?: number
          risk_level?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_protections_tenant_id_appointment_id_fkey"
            columns: ["tenant_id", "appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      appointment_reminders: {
        Row: {
          appointment_id: string
          channel: string
          created_at: string
          id: string
          recorded_by: string
          sent_at: string
          tenant_id: string
        }
        Insert: {
          appointment_id: string
          channel?: string
          created_at?: string
          id?: string
          recorded_by?: string
          sent_at?: string
          tenant_id: string
        }
        Update: {
          appointment_id?: string
          channel?: string
          created_at?: string
          id?: string
          recorded_by?: string
          sent_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_tenant_id_appointment_id_fkey"
            columns: ["tenant_id", "appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      appointments: {
        Row: {
          blocked_until: string
          cancelled_at: string | null
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
          cancelled_at?: string | null
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
          cancelled_at?: string | null
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
            referencedRelation: "customer_rebooking_opportunities"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_retention_health"
            referencedColumns: ["tenant_id", "id"]
          },
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
      customer_consent_events: {
        Row: {
          confirmation: string
          customer_id: string
          id: string
          marketing_consent: boolean
          recorded_at: string
          recorded_by: string
          tenant_id: string
        }
        Insert: {
          confirmation: string
          customer_id: string
          id?: string
          marketing_consent: boolean
          recorded_at?: string
          recorded_by?: string
          tenant_id: string
        }
        Update: {
          confirmation?: string
          customer_id?: string
          id?: string
          marketing_consent?: boolean
          recorded_at?: string
          recorded_by?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_consent_events_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_rebooking_opportunities"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_consent_events_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_retention_health"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_consent_events_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_consent_events_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summaries"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_consent_events_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
            referencedRelation: "customer_rebooking_opportunities"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_links_tenant_id_source_id_fkey"
            columns: ["tenant_id", "source_id"]
            isOneToOne: false
            referencedRelation: "customer_retention_health"
            referencedColumns: ["tenant_id", "id"]
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
            referencedRelation: "customer_rebooking_opportunities"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_links_tenant_id_target_id_fkey"
            columns: ["tenant_id", "target_id"]
            isOneToOne: false
            referencedRelation: "customer_retention_health"
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
      customer_outreach_actions: {
        Row: {
          attributed_appointment_id: string | null
          attributed_at: string | null
          channel: string
          consent_event_id: string
          contacted_at: string
          customer_id: string
          id: string
          message: string
          purpose: string
          recorded_by: string
          tenant_id: string
        }
        Insert: {
          attributed_appointment_id?: string | null
          attributed_at?: string | null
          channel: string
          consent_event_id: string
          contacted_at?: string
          customer_id: string
          id?: string
          message: string
          purpose: string
          recorded_by?: string
          tenant_id: string
        }
        Update: {
          attributed_appointment_id?: string | null
          attributed_at?: string | null
          channel?: string
          consent_event_id?: string
          contacted_at?: string
          customer_id?: string
          id?: string
          message?: string
          purpose?: string
          recorded_by?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_outreach_actions_tenant_id_attributed_appointment_fkey"
            columns: ["tenant_id", "attributed_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_outreach_actions_tenant_id_consent_event_id_fkey"
            columns: ["tenant_id", "consent_event_id"]
            isOneToOne: false
            referencedRelation: "customer_consent_events"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_outreach_actions_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_rebooking_opportunities"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_outreach_actions_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_retention_health"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_outreach_actions_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_outreach_actions_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summaries"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_outreach_actions_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
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
            referencedRelation: "customer_rebooking_opportunities"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "customer_link_tenant_fk"
            columns: ["tenant_id", "linked_customer_id"]
            isOneToOne: false
            referencedRelation: "customer_retention_health"
            referencedColumns: ["tenant_id", "id"]
          },
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
      revenue_protection_policies: {
        Row: {
          cancellation_window_hours: number
          created_at: string
          deposit_percent: number
          deposit_rule: string
          enabled: boolean
          reminder_lead_hours: number
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          cancellation_window_hours?: number
          created_at?: string
          deposit_percent?: number
          deposit_rule?: string
          enabled?: boolean
          reminder_lead_hours?: number
          tenant_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          cancellation_window_hours?: number
          created_at?: string
          deposit_percent?: number
          deposit_rule?: string
          enabled?: boolean
          reminder_lead_hours?: number
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "revenue_protection_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
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
          public_locale: string
          slug: string
          workspace_locale: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          name: string
          public_locale?: string
          slug: string
          workspace_locale?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          name?: string
          public_locale?: string
          slug?: string
          workspace_locale?: string
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          closed_at: string | null
          created_at: string
          created_by: string
          customer_id: string
          earliest_date: string
          id: string
          latest_date: string
          preferred_staff_id: string | null
          service_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          created_by?: string
          customer_id: string
          earliest_date: string
          id?: string
          latest_date: string
          preferred_staff_id?: string | null
          service_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string
          earliest_date?: string
          id?: string
          latest_date?: string
          preferred_staff_id?: string | null
          service_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_rebooking_opportunities"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_retention_health"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summaries"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_preferred_staff_id_fkey"
            columns: ["tenant_id", "preferred_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_service_id_fkey"
            columns: ["tenant_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      waitlist_recovery_actions: {
        Row: {
          attributed_appointment_id: string | null
          attributed_at: string | null
          channel: string
          consent_event_id: string
          contacted_at: string
          contacted_by: string
          id: string
          message: string
          source_appointment_id: string
          tenant_id: string
          waitlist_entry_id: string
        }
        Insert: {
          attributed_appointment_id?: string | null
          attributed_at?: string | null
          channel: string
          consent_event_id: string
          contacted_at?: string
          contacted_by?: string
          id?: string
          message: string
          source_appointment_id: string
          tenant_id: string
          waitlist_entry_id: string
        }
        Update: {
          attributed_appointment_id?: string | null
          attributed_at?: string | null
          channel?: string
          consent_event_id?: string
          contacted_at?: string
          contacted_by?: string
          id?: string
          message?: string
          source_appointment_id?: string
          tenant_id?: string
          waitlist_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_recovery_actions_tenant_id_attributed_appointment_fkey"
            columns: ["tenant_id", "attributed_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_recovery_actions_tenant_id_consent_event_id_fkey"
            columns: ["tenant_id", "consent_event_id"]
            isOneToOne: false
            referencedRelation: "customer_consent_events"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_recovery_actions_tenant_id_source_appointment_id_fkey"
            columns: ["tenant_id", "source_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_recovery_actions_tenant_id_waitlist_entry_id_fkey"
            columns: ["tenant_id", "waitlist_entry_id"]
            isOneToOne: false
            referencedRelation: "revenue_recovery_opportunities"
            referencedColumns: ["tenant_id", "waitlist_entry_id"]
          },
          {
            foreignKeyName: "waitlist_recovery_actions_tenant_id_waitlist_entry_id_fkey"
            columns: ["tenant_id", "waitlist_entry_id"]
            isOneToOne: false
            referencedRelation: "waitlist_entries"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
    }
    Views: {
      customer_rebooking_opportunities: {
        Row: {
          completed_visit_days: number | null
          days_since_visit: number | null
          display_name: string | null
          due_in_days: number | null
          email: string | null
          id: string | null
          last_visit_at: string | null
          marketing_consent: boolean | null
          potential_value_minor: number | null
          service_id: string | null
          service_name: string | null
          staff_id: string | null
          staff_name: string | null
          tenant_id: string | null
          typical_interval_days: number | null
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
      customer_retention_health: {
        Row: {
          completed_visit_days: number | null
          days_since_visit: number | null
          due_in_days: number | null
          duplicate_records: number | null
          health_status: string | null
          id: string | null
          segment: string | null
          tenant_id: string | null
          typical_interval_days: number | null
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
      revenue_protection_appointments: {
        Row: {
          appointment_id: string | null
          appointment_status: string | null
          cancellation_deadline: string | null
          cancellation_window_hours: number | null
          cancelled_at: string | null
          cancelled_count: number | null
          completed_count: number | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          deposit_paid_minor: number | null
          deposit_percent: number | null
          deposit_refunded_minor: number | null
          deposit_required_minor: number | null
          deposit_state: string | null
          no_show_count: number | null
          price_minor: number | null
          protected_value_minor: number | null
          reminder_due_at: string | null
          reminder_lead_hours: number | null
          reminder_state: string | null
          risk_level: string | null
          service_name: string | null
          starts_at: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_protections_tenant_id_appointment_id_fkey"
            columns: ["tenant_id", "appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      revenue_recovery_opportunities: {
        Row: {
          attributed_appointment_id: string | null
          blocked_until: string | null
          cancelled_at: string | null
          contacted_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          earliest_date: string | null
          ends_at: string | null
          latest_date: string | null
          match_reason: string | null
          preferred_staff_id: string | null
          price_minor: number | null
          recovery_action_id: string | null
          service_id: string | null
          service_name: string | null
          source_appointment_id: string | null
          staff_id: string | null
          staff_name: string | null
          starts_at: string | null
          tenant_id: string | null
          waitlist_entry_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_rebooking_opportunities"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_retention_health"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summaries"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_customer_id_fkey"
            columns: ["tenant_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_preferred_staff_id_fkey"
            columns: ["tenant_id", "preferred_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_service_id_fkey"
            columns: ["tenant_id", "service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
    }
    Functions: {
      accept_platform_invitation: { Args: { p_id: string }; Returns: string }
      book_waitlist_recovery: {
        Args: { p_action: string; p_request: string; p_tenant: string }
        Returns: string
      }
      booking_deposit_details: {
        Args: { p_host: string; p_token: string }
        Returns: Json
      }
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
      close_waitlist_entry: {
        Args: { p_entry: string; p_tenant: string }
        Returns: undefined
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
      create_waitlist_entry: {
        Args: {
          p_customer: string
          p_earliest: string
          p_latest: string
          p_service: string
          p_staff: string
          p_tenant: string
        }
        Returns: string
      }
      customer_outreach_summary: { Args: { p_tenant: string }; Returns: Json }
      customer_rebooking_opportunity_summary: {
        Args: { p_tenant: string }
        Returns: Json
      }
      customer_segment_counts: {
        Args: { p_query?: string; p_tenant: string }
        Returns: Json
      }
      finalize_stripe_deposit: {
        Args: { p_paid: boolean; p_payment_intent: string; p_session: string }
        Returns: undefined
      }
      finalize_stripe_refund: {
        Args: { p_amount: number; p_payment_intent: string; p_refund: string }
        Returns: undefined
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
      rebook_customer_from_outreach: {
        Args: {
          p_customer: string
          p_customer_version: number
          p_duration: number
          p_outreach: string
          p_price: number
          p_request: string
          p_service: string
          p_staff: string
          p_start: string
          p_tenant: string
        }
        Returns: string
      }
      record_appointment_reminder: {
        Args: { p_appointment: string; p_confirmed: boolean; p_tenant: string }
        Returns: string
      }
      record_customer_outreach: {
        Args: {
          p_confirmed: boolean
          p_customer: string
          p_message: string
          p_tenant: string
        }
        Returns: string
      }
      record_deposit_refund: {
        Args: {
          p_payment: string
          p_provider_reference?: string
          p_tenant: string
        }
        Returns: undefined
      }
      record_manual_deposit: {
        Args: { p_appointment: string; p_tenant: string }
        Returns: string
      }
      record_waitlist_recovery_contact: {
        Args: {
          p_confirmed: boolean
          p_entry: string
          p_message: string
          p_source: string
          p_tenant: string
        }
        Returns: string
      }
      register_stripe_deposit_checkout: {
        Args: { p_host: string; p_session: string; p_token: string }
        Returns: string
      }
      revenue_protection_summary: { Args: { p_tenant: string }; Returns: Json }
      revenue_recovery_summary: { Args: { p_tenant: string }; Returns: Json }
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
      save_revenue_protection_policy: {
        Args: {
          p_cancellation_window_hours: number
          p_deposit_percent: number
          p_deposit_rule: string
          p_enabled: boolean
          p_reminder_lead_hours: number
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
      set_customer_marketing_consent: {
        Args: {
          p_confirmed: boolean
          p_consent: boolean
          p_customer: string
          p_tenant: string
          p_version: number
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
