export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      client_assets: {
        Row: {
          id: string
          client_id: string
          category: string | null
          name: string | null
          url: string | null
          file_type: string | null
        }
        Insert: {
          id?: string
          client_id: string
          category?: string | null
          name?: string | null
          url?: string | null
          file_type?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          category?: string | null
          name?: string | null
          url?: string | null
          file_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_assets_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      client_colors: {
        Row: {
          id: string
          client_id: string
          name: string | null
          hex: string | null
        }
        Insert: {
          id?: string
          client_id: string
          name?: string | null
          hex?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          name?: string | null
          hex?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_colors_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          name: string | null
          sector: string | null
          profile_picture: string | null
          drive_folder_url: string | null
          overview_notes: string | null
          created_at: string | null
          image_settings: Json | null
          instagram: string | null
          crm: string | null
          rqe: string | null
          preferences: Json | null
        }
        Insert: {
          id?: string
          name?: string | null
          sector?: string | null
          profile_picture?: string | null
          drive_folder_url?: string | null
          overview_notes?: string | null
          created_at?: string | null
          image_settings?: Json | null
          instagram?: string | null
          crm?: string | null
          rqe?: string | null
          preferences?: Json | null
        }
        Update: {
          id?: string
          name?: string | null
          sector?: string | null
          profile_picture?: string | null
          drive_folder_url?: string | null
          overview_notes?: string | null
          created_at?: string | null
          image_settings?: Json | null
          instagram?: string | null
          crm?: string | null
          rqe?: string | null
          preferences?: Json | null
        }
        Relationships: []
      }
      client_photos: {
        Row: {
          id: string
          client_id: string
          name: string | null
          url: string | null
          thumbnail_url: string | null
          tags: string[] | null
          title: string | null
          description: string | null
          colors: string[] | null
          category: string | null
          embedding: string | null
          last_used: string | null
          usage_count: number | null
        }
        Insert: {
          id?: string
          client_id: string
          name?: string | null
          url?: string | null
          thumbnail_url?: string | null
          tags?: string[] | null
          title?: string | null
          description?: string | null
          colors?: string[] | null
          category?: string | null
          embedding?: string | null
          last_used?: string | null
          usage_count?: number | null
        }
        Update: {
          id?: string
          client_id?: string
          name?: string | null
          url?: string | null
          thumbnail_url?: string | null
          tags?: string[] | null
          title?: string | null
          description?: string | null
          colors?: string[] | null
          category?: string | null
          embedding?: string | null
          last_used?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_photos_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
