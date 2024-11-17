export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cached_galleries: {
        Row: {
          average_image_height: number | null
          average_image_size_bytes: number | null
          average_image_width: number | null
          average_video_duration: number | null
          average_video_size_bytes: number | null
          content: string | null
          created_at: string | null
          external_gallery_id: string
          id: string
          image_count: number | null
          last_fetched: string | null
          max_image_height: number | null
          max_image_width: number | null
          min_image_height: number | null
          min_image_width: number | null
          thumbnail_url: string | null
          title: string | null
          total_duration: number | null
          total_size_bytes: number | null
          url: string
          video_count: number | null
        }
        Insert: {
          average_image_height?: number | null
          average_image_size_bytes?: number | null
          average_image_width?: number | null
          average_video_duration?: number | null
          average_video_size_bytes?: number | null
          content?: string | null
          created_at?: string | null
          external_gallery_id: string
          id?: string
          image_count?: number | null
          last_fetched?: string | null
          max_image_height?: number | null
          max_image_width?: number | null
          min_image_height?: number | null
          min_image_width?: number | null
          thumbnail_url?: string | null
          title?: string | null
          total_duration?: number | null
          total_size_bytes?: number | null
          url: string
          video_count?: number | null
        }
        Update: {
          average_image_height?: number | null
          average_image_size_bytes?: number | null
          average_image_width?: number | null
          average_video_duration?: number | null
          average_video_size_bytes?: number | null
          content?: string | null
          created_at?: string | null
          external_gallery_id?: string
          id?: string
          image_count?: number | null
          last_fetched?: string | null
          max_image_height?: number | null
          max_image_width?: number | null
          min_image_height?: number | null
          min_image_width?: number | null
          thumbnail_url?: string | null
          title?: string | null
          total_duration?: number | null
          total_size_bytes?: number | null
          url?: string
          video_count?: number | null
        }
        Relationships: []
      }
      cached_images: {
        Row: {
          created_at: string | null
          external_image_id: string
          gallery_id: string | null
          height: number | null
          id: string
          size_bytes: number | null
          thumbnail_url: string | null
          title: string | null
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          external_image_id: string
          gallery_id?: string | null
          height?: number | null
          id?: string
          size_bytes?: number | null
          thumbnail_url?: string | null
          title?: string | null
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          external_image_id?: string
          gallery_id?: string | null
          height?: number | null
          id?: string
          size_bytes?: number | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cached_images_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "cached_galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      cached_videos: {
        Row: {
          created_at: string | null
          duration: number | null
          external_video_id: string
          gallery_id: string | null
          height: number | null
          id: string
          size_bytes: number | null
          thumbnail_url: string | null
          title: string | null
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          external_video_id: string
          gallery_id?: string | null
          height?: number | null
          id?: string
          size_bytes?: number | null
          thumbnail_url?: string | null
          title?: string | null
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          external_video_id?: string
          gallery_id?: string | null
          height?: number | null
          id?: string
          size_bytes?: number | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cached_videos_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "cached_galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      download_progress: {
        Row: {
          created_at: string | null
          filename: string
          id: string
          progress: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          filename: string
          id?: string
          progress?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          filename?: string
          id?: string
          progress?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      search_results: {
        Row: {
          created_at: string | null
          id: string
          image_count: number | null
          last_fetched: string | null
          query: string
          thumbnail_url: string | null
          title: string | null
          url: string
          video_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_count?: number | null
          last_fetched?: string | null
          query: string
          thumbnail_url?: string | null
          title?: string | null
          url: string
          video_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_count?: number | null
          last_fetched?: string | null
          query?: string
          thumbnail_url?: string | null
          title?: string | null
          url?: string
          video_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_downloads: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_search_results: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

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
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
