// Generated from the Supabase schema. Do not edit by hand — regenerate after
// every migration.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assignment_files: {
        Row: {
          assignment_id: string
          created_at: string
          file_name: string
          id: string
          mime_type: string
          size_bytes: number | null
          sort_order: number
          storage_path: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          file_name?: string
          id?: string
          mime_type: string
          size_bytes?: number | null
          sort_order?: number
          storage_path: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          size_bytes?: number | null
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_files_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          category_id: string | null
          completion_pct: number
          created_at: string
          description: string | null
          due_at: string
          id: string
          reviewed_at: string | null
          stage: string | null
          student_id: string
          student_opened_at: string | null
          submitted_at: string | null
          title: string
          tutor_id: string
          type: Database["public"]["Enums"]["assignment_type"]
          updated_at: string
          verdict: Database["public"]["Enums"]["review_verdict"] | null
        }
        Insert: {
          category_id?: string | null
          completion_pct?: number
          created_at?: string
          description?: string | null
          due_at: string
          id?: string
          reviewed_at?: string | null
          student_id: string
          student_opened_at?: string | null
          submitted_at?: string | null
          title: string
          tutor_id: string
          type?: Database["public"]["Enums"]["assignment_type"]
          updated_at?: string
          verdict?: Database["public"]["Enums"]["review_verdict"] | null
        }
        Update: {
          category_id?: string | null
          completion_pct?: number
          created_at?: string
          description?: string | null
          due_at?: string
          id?: string
          reviewed_at?: string | null
          student_id?: string
          student_opened_at?: string | null
          submitted_at?: string | null
          title?: string
          tutor_id?: string
          type?: Database["public"]["Enums"]["assignment_type"]
          updated_at?: string
          verdict?: Database["public"]["Enums"]["review_verdict"] | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          accent_key: string
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          accent_key?: string
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          accent_key?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          assignment_id: string
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
        }
        Insert: {
          assignment_id: string
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
        }
        Update: {
          assignment_id?: string
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          calendar_token: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          timezone: string
          updated_at: string
        }
        Insert: {
          calendar_token?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          calendar_token?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assignment_id: string
          created_at: string
          file_name: string
          id: string
          mime_type: string
          revision: number
          size_bytes: number | null
          storage_path: string
          student_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          file_name?: string
          id?: string
          mime_type: string
          revision?: number
          size_bytes?: number | null
          storage_path: string
          student_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          revision?: number
          size_bytes?: number | null
          storage_path?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_settings: {
        Row: {
          reminder_windows: number[]
          tutor_id: string
          updated_at: string
        }
        Insert: {
          reminder_windows?: number[]
          tutor_id: string
          updated_at?: string
        }
        Update: {
          reminder_windows?: number[]
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_settings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      assignment_type: "problem_set" | "reading_notes"
      review_verdict: "approved" | "changes_requested"
      user_role: "tutor" | "student"
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

export const Constants = {
  public: {
    Enums: {
      assignment_type: ["problem_set", "reading_notes"],
      review_verdict: ["approved", "changes_requested"],
      user_role: ["tutor", "student"],
    },
  },
} as const
