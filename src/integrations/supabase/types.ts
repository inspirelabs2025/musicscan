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
      batch_uploads: {
        Row: {
          created_at: string
          error_message: string | null
          file_paths: string[]
          id: string
          image_count: number
          media_type: string
          processing_results: Json | null
          status: string
          updated_at: string
          upload_timestamp: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_paths?: string[]
          id?: string
          image_count: number
          media_type: string
          processing_results?: Json | null
          status?: string
          updated_at?: string
          upload_timestamp?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_paths?: string[]
          id?: string
          image_count?: number
          media_type?: string
          processing_results?: Json | null
          status?: string
          updated_at?: string
          upload_timestamp?: string
        }
        Relationships: []
      }
      cd_scan: {
        Row: {
          artist: string | null
          back_image: string | null
          barcode_image: string | null
          barcode_number: string | null
          calculated_advice_price: number | null
          catalog_number: string | null
          condition_grade: string | null
          country: string | null
          created_at: string
          currency: string | null
          discogs_id: number | null
          discogs_url: string | null
          format: string | null
          front_image: string | null
          genre: string | null
          highest_price: number | null
          id: string
          label: string | null
          lowest_price: number | null
          marketplace_allow_offers: boolean | null
          marketplace_comments: string | null
          marketplace_external_id: string | null
          marketplace_format_quantity: number | null
          marketplace_location: string | null
          marketplace_price: number | null
          marketplace_sleeve_condition: string | null
          marketplace_status: string | null
          marketplace_weight: number | null
          matrix_image: string | null
          median_price: number | null
          title: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          artist?: string | null
          back_image?: string | null
          barcode_image?: string | null
          barcode_number?: string | null
          calculated_advice_price?: number | null
          catalog_number?: string | null
          condition_grade?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          discogs_id?: number | null
          discogs_url?: string | null
          format?: string | null
          front_image?: string | null
          genre?: string | null
          highest_price?: number | null
          id?: string
          label?: string | null
          lowest_price?: number | null
          marketplace_allow_offers?: boolean | null
          marketplace_comments?: string | null
          marketplace_external_id?: string | null
          marketplace_format_quantity?: number | null
          marketplace_location?: string | null
          marketplace_price?: number | null
          marketplace_sleeve_condition?: string | null
          marketplace_status?: string | null
          marketplace_weight?: number | null
          matrix_image?: string | null
          median_price?: number | null
          title?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          artist?: string | null
          back_image?: string | null
          barcode_image?: string | null
          barcode_number?: string | null
          calculated_advice_price?: number | null
          catalog_number?: string | null
          condition_grade?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          discogs_id?: number | null
          discogs_url?: string | null
          format?: string | null
          front_image?: string | null
          genre?: string | null
          highest_price?: number | null
          id?: string
          label?: string | null
          lowest_price?: number | null
          marketplace_allow_offers?: boolean | null
          marketplace_comments?: string | null
          marketplace_external_id?: string | null
          marketplace_format_quantity?: number | null
          marketplace_location?: string | null
          marketplace_price?: number | null
          marketplace_sleeve_condition?: string | null
          marketplace_status?: string | null
          marketplace_weight?: number | null
          matrix_image?: string | null
          median_price?: number | null
          title?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      discogs_price_listings: {
        Row: {
          condition: string
          condition_normalized: string | null
          currency: string
          extracted_at: string
          id: string
          listing_url: string | null
          price: number
          seller_location: string | null
          session_id: string
          shipping_cost: number | null
          source_type: string
        }
        Insert: {
          condition: string
          condition_normalized?: string | null
          currency?: string
          extracted_at?: string
          id?: string
          listing_url?: string | null
          price: number
          seller_location?: string | null
          session_id: string
          shipping_cost?: number | null
          source_type?: string
        }
        Update: {
          condition?: string
          condition_normalized?: string | null
          currency?: string
          extracted_at?: string
          id?: string
          listing_url?: string | null
          price?: number
          seller_location?: string | null
          session_id?: string
          shipping_cost?: number | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "discogs_price_listings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "discogs_pricing_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      discogs_pricing_sessions: {
        Row: {
          artist_name: string | null
          created_at: string
          discogs_id: number
          discogs_url: string
          error_message: string | null
          execution_time_ms: number | null
          extraction_method: string
          highest_price: number | null
          id: string
          last_sold_date: string | null
          lowest_price: number | null
          median_price: number | null
          num_for_sale: number | null
          official_highest_price: number | null
          official_lowest_price: number | null
          official_median_price: number | null
          raw_response: string | null
          release_title: string | null
          strategy_used: string | null
          success: boolean
          total_prices_found: number | null
          updated_at: string
        }
        Insert: {
          artist_name?: string | null
          created_at?: string
          discogs_id: number
          discogs_url: string
          error_message?: string | null
          execution_time_ms?: number | null
          extraction_method?: string
          highest_price?: number | null
          id?: string
          last_sold_date?: string | null
          lowest_price?: number | null
          median_price?: number | null
          num_for_sale?: number | null
          official_highest_price?: number | null
          official_lowest_price?: number | null
          official_median_price?: number | null
          raw_response?: string | null
          release_title?: string | null
          strategy_used?: string | null
          success?: boolean
          total_prices_found?: number | null
          updated_at?: string
        }
        Update: {
          artist_name?: string | null
          created_at?: string
          discogs_id?: number
          discogs_url?: string
          error_message?: string | null
          execution_time_ms?: number | null
          extraction_method?: string
          highest_price?: number | null
          id?: string
          last_sold_date?: string | null
          lowest_price?: number | null
          median_price?: number | null
          num_for_sale?: number | null
          official_highest_price?: number | null
          official_lowest_price?: number | null
          official_median_price?: number | null
          raw_response?: string | null
          release_title?: string | null
          strategy_used?: string | null
          success?: boolean
          total_prices_found?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      discogs_release_statistics: {
        Row: {
          avg_rating: number | null
          created_at: string
          currency: string | null
          discogs_api_used: boolean | null
          discogs_id: number
          discogs_url: string
          error_message: string | null
          have_count: number | null
          highest_price: number | null
          id: string
          last_sold_date: string | null
          lowest_price: number | null
          median_price: number | null
          ratings_count: number | null
          raw_response: Json | null
          scraped_at: string
          scraper_api_used: boolean | null
          success: boolean | null
          updated_at: string
          want_count: number | null
        }
        Insert: {
          avg_rating?: number | null
          created_at?: string
          currency?: string | null
          discogs_api_used?: boolean | null
          discogs_id: number
          discogs_url: string
          error_message?: string | null
          have_count?: number | null
          highest_price?: number | null
          id?: string
          last_sold_date?: string | null
          lowest_price?: number | null
          median_price?: number | null
          ratings_count?: number | null
          raw_response?: Json | null
          scraped_at?: string
          scraper_api_used?: boolean | null
          success?: boolean | null
          updated_at?: string
          want_count?: number | null
        }
        Update: {
          avg_rating?: number | null
          created_at?: string
          currency?: string | null
          discogs_api_used?: boolean | null
          discogs_id?: number
          discogs_url?: string
          error_message?: string | null
          have_count?: number | null
          highest_price?: number | null
          id?: string
          last_sold_date?: string | null
          lowest_price?: number | null
          median_price?: number | null
          ratings_count?: number | null
          raw_response?: Json | null
          scraped_at?: string
          scraper_api_used?: boolean | null
          success?: boolean | null
          updated_at?: string
          want_count?: number | null
        }
        Relationships: []
      }
      vinyl_records: {
        Row: {
          artist: string
          calculated_price: number | null
          catalog_image_base64: string | null
          catalog_number: string | null
          condition_assessment_date: string | null
          condition_notes: string | null
          condition_sleeve: string | null
          condition_vinyl: string | null
          country: string | null
          cover_image: string | null
          created_at: string | null
          discogs_id: number | null
          discogs_search_url: string | null
          discogs_url: string | null
          for_sale_count: number | null
          format: string | null
          genre: string | null
          have_count: number | null
          highest_price: number | null
          id: string
          label: string | null
          label_image_base64: string | null
          lowest_price: number | null
          matrix_image_base64: string | null
          matrix_number: string | null
          median_price: number | null
          raw_text: string | null
          sale_history_url: string | null
          scanned_date: string | null
          title: string
          updated_at: string | null
          want_count: number | null
          year: number | null
        }
        Insert: {
          artist: string
          calculated_price?: number | null
          catalog_image_base64?: string | null
          catalog_number?: string | null
          condition_assessment_date?: string | null
          condition_notes?: string | null
          condition_sleeve?: string | null
          condition_vinyl?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string | null
          discogs_id?: number | null
          discogs_search_url?: string | null
          discogs_url?: string | null
          for_sale_count?: number | null
          format?: string | null
          genre?: string | null
          have_count?: number | null
          highest_price?: number | null
          id?: string
          label?: string | null
          label_image_base64?: string | null
          lowest_price?: number | null
          matrix_image_base64?: string | null
          matrix_number?: string | null
          median_price?: number | null
          raw_text?: string | null
          sale_history_url?: string | null
          scanned_date?: string | null
          title: string
          updated_at?: string | null
          want_count?: number | null
          year?: number | null
        }
        Update: {
          artist?: string
          calculated_price?: number | null
          catalog_image_base64?: string | null
          catalog_number?: string | null
          condition_assessment_date?: string | null
          condition_notes?: string | null
          condition_sleeve?: string | null
          condition_vinyl?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string | null
          discogs_id?: number | null
          discogs_search_url?: string | null
          discogs_url?: string | null
          for_sale_count?: number | null
          format?: string | null
          genre?: string | null
          have_count?: number | null
          highest_price?: number | null
          id?: string
          label?: string | null
          label_image_base64?: string | null
          lowest_price?: number | null
          matrix_image_base64?: string | null
          matrix_number?: string | null
          median_price?: number | null
          raw_text?: string | null
          sale_history_url?: string | null
          scanned_date?: string | null
          title?: string
          updated_at?: string | null
          want_count?: number | null
          year?: number | null
        }
        Relationships: []
      }
      vinyl_records_backup: {
        Row: {
          artist: string | null
          backup_created_at: string | null
          catalog_number: string | null
          country: string | null
          cover_image: string | null
          created_at: string | null
          discogs_id: number | null
          discogs_search_url: string | null
          discogs_url: string | null
          for_sale_count: number | null
          format: string | null
          genre: string | null
          have_count: number | null
          highest_price: number | null
          id: string | null
          label: string | null
          lowest_price: number | null
          matrix_number: string | null
          median_price: number | null
          raw_text: string | null
          sale_history_url: string | null
          scanned_date: string | null
          title: string | null
          updated_at: string | null
          want_count: number | null
          year: number | null
        }
        Insert: {
          artist?: string | null
          backup_created_at?: string | null
          catalog_number?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string | null
          discogs_id?: number | null
          discogs_search_url?: string | null
          discogs_url?: string | null
          for_sale_count?: number | null
          format?: string | null
          genre?: string | null
          have_count?: number | null
          highest_price?: number | null
          id?: string | null
          label?: string | null
          lowest_price?: number | null
          matrix_number?: string | null
          median_price?: number | null
          raw_text?: string | null
          sale_history_url?: string | null
          scanned_date?: string | null
          title?: string | null
          updated_at?: string | null
          want_count?: number | null
          year?: number | null
        }
        Update: {
          artist?: string | null
          backup_created_at?: string | null
          catalog_number?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string | null
          discogs_id?: number | null
          discogs_search_url?: string | null
          discogs_url?: string | null
          for_sale_count?: number | null
          format?: string | null
          genre?: string | null
          have_count?: number | null
          highest_price?: number | null
          id?: string | null
          label?: string | null
          lowest_price?: number | null
          matrix_number?: string | null
          median_price?: number | null
          raw_text?: string | null
          sale_history_url?: string | null
          scanned_date?: string | null
          title?: string | null
          updated_at?: string | null
          want_count?: number | null
          year?: number | null
        }
        Relationships: []
      }
      vinyl2_scan: {
        Row: {
          additional_image: string | null
          artist: string | null
          calculated_advice_price: number | null
          catalog_image: string | null
          catalog_number: string | null
          condition_grade: string | null
          country: string | null
          created_at: string
          currency: string | null
          discogs_id: number | null
          discogs_url: string | null
          format: string | null
          genre: string | null
          highest_price: number | null
          id: string
          label: string | null
          lowest_price: number | null
          marketplace_allow_offers: boolean | null
          marketplace_comments: string | null
          marketplace_external_id: string | null
          marketplace_format_quantity: number | null
          marketplace_location: string | null
          marketplace_price: number | null
          marketplace_sleeve_condition: string | null
          marketplace_status: string | null
          marketplace_weight: number | null
          matrix_image: string | null
          matrix_number: string | null
          median_price: number | null
          title: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          additional_image?: string | null
          artist?: string | null
          calculated_advice_price?: number | null
          catalog_image?: string | null
          catalog_number?: string | null
          condition_grade?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          discogs_id?: number | null
          discogs_url?: string | null
          format?: string | null
          genre?: string | null
          highest_price?: number | null
          id?: string
          label?: string | null
          lowest_price?: number | null
          marketplace_allow_offers?: boolean | null
          marketplace_comments?: string | null
          marketplace_external_id?: string | null
          marketplace_format_quantity?: number | null
          marketplace_location?: string | null
          marketplace_price?: number | null
          marketplace_sleeve_condition?: string | null
          marketplace_status?: string | null
          marketplace_weight?: number | null
          matrix_image?: string | null
          matrix_number?: string | null
          median_price?: number | null
          title?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          additional_image?: string | null
          artist?: string | null
          calculated_advice_price?: number | null
          catalog_image?: string | null
          catalog_number?: string | null
          condition_grade?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          discogs_id?: number | null
          discogs_url?: string | null
          format?: string | null
          genre?: string | null
          highest_price?: number | null
          id?: string
          label?: string | null
          lowest_price?: number | null
          marketplace_allow_offers?: boolean | null
          marketplace_comments?: string | null
          marketplace_external_id?: string | null
          marketplace_format_quantity?: number | null
          marketplace_location?: string | null
          marketplace_price?: number | null
          marketplace_sleeve_condition?: string | null
          marketplace_status?: string | null
          marketplace_weight?: number | null
          matrix_image?: string | null
          matrix_number?: string | null
          median_price?: number | null
          title?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extract_and_update_discogs_ids: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      extract_discogs_id_from_url: {
        Args: { url_text: string }
        Returns: number
      }
      update_cd_discogs_ids: {
        Args: Record<PropertyKey, never>
        Returns: number
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
