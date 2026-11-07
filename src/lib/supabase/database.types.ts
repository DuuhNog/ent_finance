export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
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
      audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          household_id: string
          id: string
          new_data: Json | null
          old_data: Json | null
          row_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          household_id: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          row_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          household_id?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          row_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_log_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          household_id: string
          id: string
          is_savings: boolean
          kind: string
          name: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          household_id: string
          id?: string
          is_savings?: boolean
          kind: string
          name: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          household_id?: string
          id?: string
          is_savings?: boolean
          kind?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'categories_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      goals: {
        Row: {
          amount_cents: number
          archived_at: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          household_id: string
          id: string
          kind: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          archived_at?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          household_id: string
          id?: string
          kind: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          archived_at?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          household_id?: string
          id?: string
          kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'goals_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'goals_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      household_members: {
        Row: {
          created_at: string
          household_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'household_members_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          household_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          household_id: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          household_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      recurring_bills: {
        Row: {
          amount_cents: number
          archived_at: string | null
          category_id: string
          created_at: string
          created_by: string | null
          due_day: number
          household_id: string
          id: string
          is_variable: boolean
          name: string
          payment_method: string
          start_month: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          archived_at?: string | null
          category_id: string
          created_at?: string
          created_by?: string | null
          due_day: number
          household_id: string
          id?: string
          is_variable?: boolean
          name: string
          payment_method: string
          start_month?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          archived_at?: string | null
          category_id?: string
          created_at?: string
          created_by?: string | null
          due_day?: number
          household_id?: string
          id?: string
          is_variable?: boolean
          name?: string
          payment_method?: string
          start_month?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recurring_bills_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recurring_bills_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          amount_cents: number
          category_id: string
          competence_month: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          household_id: string
          id: string
          installment_group_id: string | null
          installment_number: number | null
          installment_total: number | null
          kind: string
          occurred_on: string
          payment_method: string | null
          recurring_bill_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          category_id: string
          competence_month?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          household_id: string
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          installment_total?: number | null
          kind: string
          occurred_on: string
          payment_method?: string | null
          recurring_bill_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          category_id?: string
          competence_month?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          household_id?: string
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          installment_total?: number | null
          kind?: string
          occurred_on?: string
          payment_method?: string | null
          recurring_bill_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_recurring_bill_id_fkey'
            columns: ['recurring_bill_id']
            isOneToOne: false
            referencedRelation: 'recurring_bills'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_installment_purchase: {
        Args: {
          p_category_id: string
          p_description?: string
          p_first_occurred_on: string
          p_household_id: string
          p_installments: number
          p_total_amount_cents: number
        }
        Returns: {
          amount_cents: number
          category_id: string
          competence_month: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          household_id: string
          id: string
          installment_group_id: string | null
          installment_number: number | null
          installment_total: number | null
          kind: string
          occurred_on: string
          payment_method: string | null
          recurring_bill_id: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'transactions'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      pay_recurring_bill: {
        Args: { amount_cents: number; bill_id: string; month: string }
        Returns: {
          amount_cents: number
          category_id: string
          competence_month: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          household_id: string
          id: string
          installment_group_id: string | null
          installment_number: number | null
          installment_total: number | null
          kind: string
          occurred_on: string
          payment_method: string | null
          recurring_bill_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'transactions'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resume_installment_purchase: {
        Args: {
          p_category_id: string
          p_description?: string
          p_first_occurred_on: string
          p_household_id: string
          p_installment_amount_cents: number
          p_start_installment: number
          p_total_installments: number
        }
        Returns: {
          amount_cents: number
          category_id: string
          competence_month: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          household_id: string
          id: string
          installment_group_id: string | null
          installment_number: number | null
          installment_total: number | null
          kind: string
          occurred_on: string
          payment_method: string | null
          recurring_bill_id: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'transactions'
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
