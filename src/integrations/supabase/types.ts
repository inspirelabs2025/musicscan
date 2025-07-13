export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_story_cache: {
        Row: {
          ai_response: string
          album_title: string | null
          artist: string
          created_at: string
          generation_time_ms: number | null
          id: string
          model_used: string | null
          prompt_used: string | null
          release_month: string | null
          release_year: number | null
          search_query: string
          search_type: string
          song_title: string | null
          updated_at: string
        }
        Insert: {
          ai_response: string
          album_title?: string | null
          artist: string
          created_at?: string
          generation_time_ms?: number | null
          id?: string
          model_used?: string | null
          prompt_used?: string | null
          release_month?: string | null
          release_year?: number | null
          search_query: string
          search_type: string
          song_title?: string | null
          updated_at?: string
        }
        Update: {
          ai_response?: string
          album_title?: string | null
          artist?: string
          created_at?: string
          generation_time_ms?: number | null
          id?: string
          model_used?: string | null
          prompt_used?: string | null
          release_month?: string | null
          release_year?: number | null
          search_query?: string
          search_type?: string
          song_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      album_covers: {
        Row: {
          album_name: string | null
          album_title: string
          cover_artist: string
          cover_title: string
          created_at: string
          genre: string | null
          id: string
          info: string | null
          original_artist: string
          release_date: string | null
          search_query: string
          source: string
          updated_at: string
        }
        Insert: {
          album_name?: string | null
          album_title: string
          cover_artist: string
          cover_title: string
          created_at?: string
          genre?: string | null
          id?: string
          info?: string | null
          original_artist: string
          release_date?: string | null
          search_query: string
          source: string
          updated_at?: string
        }
        Update: {
          album_name?: string | null
          album_title?: string
          cover_artist?: string
          cover_title?: string
          created_at?: string
          genre?: string | null
          id?: string
          info?: string | null
          original_artist?: string
          release_date?: string | null
          search_query?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string
          excerpt: string | null
          featured_image: string | null
          id: string
          published_at: string | null
          read_time: number | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          source_story_data: Json | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          read_time?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          source_story_data?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          read_time?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          source_story_data?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fan_stories: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean
          related_album: string | null
          related_artist: string
          related_song: string | null
          story_content: string
          story_title: string
          story_type: string
          updated_at: string
          user_email: string | null
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean
          related_album?: string | null
          related_artist: string
          related_song?: string | null
          story_content: string
          story_title: string
          story_type: string
          updated_at?: string
          user_email?: string | null
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean
          related_album?: string | null
          related_artist?: string
          related_song?: string | null
          story_content?: string
          story_title?: string
          story_type?: string
          updated_at?: string
          user_email?: string | null
          user_name?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          album_title: string
          artist: string
          created_at: string
          generation_time_ms: number | null
          id: string
          model_used: string | null
          questions_data: Json
          quiz_type: string
          search_query: string
          source: string
          updated_at: string
        }
        Insert: {
          album_title: string
          artist: string
          created_at?: string
          generation_time_ms?: number | null
          id?: string
          model_used?: string | null
          questions_data: Json
          quiz_type?: string
          search_query: string
          source?: string
          updated_at?: string
        }
        Update: {
          album_title?: string
          artist?: string
          created_at?: string
          generation_time_ms?: number | null
          id?: string
          model_used?: string | null
          questions_data?: Json
          quiz_type?: string
          search_query?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      song_youtube_videos: {
        Row: {
          artist: string
          created_at: string
          found_via_api: string | null
          id: string
          search_query: string
          song_title: string
          updated_at: string
          youtube_channel: string | null
          youtube_title: string
          youtube_url: string
          youtube_video_id: string
        }
        Insert: {
          artist: string
          created_at?: string
          found_via_api?: string | null
          id?: string
          search_query: string
          song_title: string
          updated_at?: string
          youtube_channel?: string | null
          youtube_title: string
          youtube_url: string
          youtube_video_id: string
        }
        Update: {
          artist?: string
          created_at?: string
          found_via_api?: string | null
          id?: string
          search_query?: string
          song_title?: string
          updated_at?: string
          youtube_channel?: string | null
          youtube_title?: string
          youtube_url?: string
          youtube_video_id?: string
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
