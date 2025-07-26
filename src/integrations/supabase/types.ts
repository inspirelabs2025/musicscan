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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_scan_results: {
        Row: {
          ai_description: string | null
          analysis_data: Json | null
          artist: string | null
          barcode: string | null
          catalog_number: string | null
          comments: string | null
          condition_grade: string
          confidence_score: number | null
          country: string | null
          created_at: string
          discogs_id: number | null
          discogs_url: string | null
          edit_history: Json | null
          error_message: string | null
          format: string | null
          genre: string | null
          id: string
          is_flagged_incorrect: boolean | null
          label: string | null
          manual_edits: Json | null
          master_id: number | null
          matrix_number: string | null
          media_type: string
          photo_urls: string[]
          search_queries: string[] | null
          status: string
          style: string[] | null
          title: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          ai_description?: string | null
          analysis_data?: Json | null
          artist?: string | null
          barcode?: string | null
          catalog_number?: string | null
          comments?: string | null
          condition_grade: string
          confidence_score?: number | null
          country?: string | null
          created_at?: string
          discogs_id?: number | null
          discogs_url?: string | null
          edit_history?: Json | null
          error_message?: string | null
          format?: string | null
          genre?: string | null
          id?: string
          is_flagged_incorrect?: boolean | null
          label?: string | null
          manual_edits?: Json | null
          master_id?: number | null
          matrix_number?: string | null
          media_type: string
          photo_urls: string[]
          search_queries?: string[] | null
          status?: string
          style?: string[] | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          ai_description?: string | null
          analysis_data?: Json | null
          artist?: string | null
          barcode?: string | null
          catalog_number?: string | null
          comments?: string | null
          condition_grade?: string
          confidence_score?: number | null
          country?: string | null
          created_at?: string
          discogs_id?: number | null
          discogs_url?: string | null
          edit_history?: Json | null
          error_message?: string | null
          format?: string | null
          genre?: string | null
          id?: string
          is_flagged_incorrect?: boolean | null
          label?: string | null
          manual_edits?: Json | null
          master_id?: number | null
          matrix_number?: string | null
          media_type?: string
          photo_urls?: string[]
          search_queries?: string[] | null
          status?: string
          style?: string[] | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      album_insights: {
        Row: {
          ai_model: string
          album_id: string
          album_type: string
          cached_until: string | null
          created_at: string
          generation_time_ms: number | null
          id: string
          insights_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model?: string
          album_id: string
          album_type: string
          cached_until?: string | null
          created_at?: string
          generation_time_ms?: number | null
          id?: string
          insights_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model?: string
          album_id?: string
          album_type?: string
          cached_until?: string | null
          created_at?: string
          generation_time_ms?: number | null
          id?: string
          insights_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      batch_uploads: {
        Row: {
          condition_grade: string | null
          created_at: string
          error_message: string | null
          file_paths: string[]
          id: string
          image_count: number
          media_type: string
          photo_metadata: Json | null
          photo_urls: string[] | null
          processing_results: Json | null
          status: string
          thumbnail_urls: string[] | null
          updated_at: string
          upload_timestamp: string
          user_id: string
        }
        Insert: {
          condition_grade?: string | null
          created_at?: string
          error_message?: string | null
          file_paths?: string[]
          id?: string
          image_count: number
          media_type: string
          photo_metadata?: Json | null
          photo_urls?: string[] | null
          processing_results?: Json | null
          status?: string
          thumbnail_urls?: string[] | null
          updated_at?: string
          upload_timestamp?: string
          user_id: string
        }
        Update: {
          condition_grade?: string | null
          created_at?: string
          error_message?: string | null
          file_paths?: string[]
          id?: string
          image_count?: number
          media_type?: string
          photo_metadata?: Json | null
          photo_urls?: string[] | null
          processing_results?: Json | null
          status?: string
          thumbnail_urls?: string[] | null
          updated_at?: string
          upload_timestamp?: string
          user_id?: string
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
          is_for_sale: boolean | null
          is_public: boolean | null
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
          release_id: string | null
          shop_description: string | null
          side: string | null
          stamper_codes: string | null
          style: string[] | null
          title: string | null
          updated_at: string
          user_id: string
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
          is_for_sale?: boolean | null
          is_public?: boolean | null
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
          release_id?: string | null
          shop_description?: string | null
          side?: string | null
          stamper_codes?: string | null
          style?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
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
          is_for_sale?: boolean | null
          is_public?: boolean | null
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
          release_id?: string | null
          shop_description?: string | null
          side?: string | null
          stamper_codes?: string | null
          style?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cd_scan_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          ai_model: string | null
          collection_context: Json | null
          created_at: string
          format_type: string | null
          id: string
          message: string
          response_time_ms: number | null
          sender_type: string
          session_id: string | null
          tokens_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          collection_context?: Json | null
          created_at?: string
          format_type?: string | null
          id?: string
          message: string
          response_time_ms?: number | null
          sender_type: string
          session_id?: string | null
          tokens_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model?: string | null
          collection_context?: Json | null
          created_at?: string
          format_type?: string | null
          id?: string
          message?: string
          response_time_ms?: number | null
          sender_type?: string
          session_id?: string | null
          tokens_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demand_analytics: {
        Row: {
          analysis_period: string
          avg_selling_price: number | null
          brand: string | null
          category: string | null
          competition_level: string | null
          confidence_level: string | null
          created_at: string
          data_sources: string[] | null
          demand_score: number | null
          id: string
          oem_number: string
          part_name: string
          period_end: string
          period_start: string
          price_change_percentage: number | null
          price_trend: string | null
          search_volume: number | null
          seasonality_factor: number | null
          supply_count: number | null
          updated_at: string
        }
        Insert: {
          analysis_period: string
          avg_selling_price?: number | null
          brand?: string | null
          category?: string | null
          competition_level?: string | null
          confidence_level?: string | null
          created_at?: string
          data_sources?: string[] | null
          demand_score?: number | null
          id?: string
          oem_number: string
          part_name: string
          period_end: string
          period_start: string
          price_change_percentage?: number | null
          price_trend?: string | null
          search_volume?: number | null
          seasonality_factor?: number | null
          supply_count?: number | null
          updated_at?: string
        }
        Update: {
          analysis_period?: string
          avg_selling_price?: number | null
          brand?: string | null
          category?: string | null
          competition_level?: string | null
          confidence_level?: string | null
          created_at?: string
          data_sources?: string[] | null
          demand_score?: number | null
          id?: string
          oem_number?: string
          part_name?: string
          period_end?: string
          period_start?: string
          price_change_percentage?: number | null
          price_trend?: string | null
          search_volume?: number | null
          seasonality_factor?: number | null
          supply_count?: number | null
          updated_at?: string
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
      market_prices: {
        Row: {
          condition_grade: string
          created_at: string
          currency: string
          id: string
          is_sold: boolean | null
          listing_date: string
          listing_url: string | null
          oem_number: string
          part_name: string
          platform: string
          price: number
          return_policy: string | null
          scraped_at: string
          seller_location: string | null
          seller_rating: number | null
          shipping_cost: number | null
          sold_date: string | null
          updated_at: string
          views_count: number | null
          warranty_period: string | null
        }
        Insert: {
          condition_grade: string
          created_at?: string
          currency?: string
          id?: string
          is_sold?: boolean | null
          listing_date: string
          listing_url?: string | null
          oem_number: string
          part_name: string
          platform: string
          price: number
          return_policy?: string | null
          scraped_at?: string
          seller_location?: string | null
          seller_rating?: number | null
          shipping_cost?: number | null
          sold_date?: string | null
          updated_at?: string
          views_count?: number | null
          warranty_period?: string | null
        }
        Update: {
          condition_grade?: string
          created_at?: string
          currency?: string
          id?: string
          is_sold?: boolean | null
          listing_date?: string
          listing_url?: string | null
          oem_number?: string
          part_name?: string
          platform?: string
          price?: number
          return_policy?: string | null
          scraped_at?: string
          seller_location?: string | null
          seller_rating?: number | null
          shipping_cost?: number | null
          sold_date?: string | null
          updated_at?: string
          views_count?: number | null
          warranty_period?: string | null
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          auto_relist: boolean | null
          created_at: string
          currency: string
          description: string | null
          ends_at: string | null
          fees: number | null
          id: string
          last_sync: string | null
          listed_at: string | null
          listing_duration: number | null
          listing_id: string | null
          listing_url: string | null
          platform: string
          price: number
          questions_count: number | null
          shipping_cost: number | null
          sold_at: string | null
          sold_price: number | null
          status: string
          sync_error: string | null
          sync_status: string | null
          title: string
          updated_at: string
          user_id: string
          vehicle_part_id: string
          views_count: number | null
          watchers_count: number | null
        }
        Insert: {
          auto_relist?: boolean | null
          created_at?: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          fees?: number | null
          id?: string
          last_sync?: string | null
          listed_at?: string | null
          listing_duration?: number | null
          listing_id?: string | null
          listing_url?: string | null
          platform: string
          price: number
          questions_count?: number | null
          shipping_cost?: number | null
          sold_at?: string | null
          sold_price?: number | null
          status?: string
          sync_error?: string | null
          sync_status?: string | null
          title: string
          updated_at?: string
          user_id: string
          vehicle_part_id: string
          views_count?: number | null
          watchers_count?: number | null
        }
        Update: {
          auto_relist?: boolean | null
          created_at?: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          fees?: number | null
          id?: string
          last_sync?: string | null
          listed_at?: string | null
          listing_duration?: number | null
          listing_id?: string | null
          listing_url?: string | null
          platform?: string
          price?: number
          questions_count?: number | null
          shipping_cost?: number | null
          sold_at?: string | null
          sold_price?: number | null
          status?: string
          sync_error?: string | null
          sync_status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          vehicle_part_id?: string
          views_count?: number | null
          watchers_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_vehicle_part_id_fkey"
            columns: ["vehicle_part_id"]
            isOneToOne: false
            referencedRelation: "vehicle_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_sync: {
        Row: {
          completed_at: string | null
          created_at: string
          entity_id: string
          entity_type: string
          error_message: string | null
          external_id: string | null
          id: string
          max_retries: number | null
          platform: string
          request_data: Json | null
          response_data: Json | null
          retry_count: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          sync_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          max_retries?: number | null
          platform: string
          request_data?: Json | null
          response_data?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          sync_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          max_retries?: number | null
          platform?: string
          request_data?: Json | null
          response_data?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          sync_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      oem_numbers: {
        Row: {
          alternative_numbers: string[] | null
          brand: string | null
          category: string | null
          compatible_vehicles: Json | null
          created_at: string
          dimensions_range: Json | null
          id: string
          is_verified: boolean | null
          oem_number: string
          part_name: string
          tecdoc_id: string | null
          typical_condition_price: Json | null
          updated_at: string
          verification_source: string | null
          weight_range: Json | null
        }
        Insert: {
          alternative_numbers?: string[] | null
          brand?: string | null
          category?: string | null
          compatible_vehicles?: Json | null
          created_at?: string
          dimensions_range?: Json | null
          id?: string
          is_verified?: boolean | null
          oem_number: string
          part_name: string
          tecdoc_id?: string | null
          typical_condition_price?: Json | null
          updated_at?: string
          verification_source?: string | null
          weight_range?: Json | null
        }
        Update: {
          alternative_numbers?: string[] | null
          brand?: string | null
          category?: string | null
          compatible_vehicles?: Json | null
          created_at?: string
          dimensions_range?: Json | null
          id?: string
          is_verified?: boolean | null
          oem_number?: string
          part_name?: string
          tecdoc_id?: string | null
          typical_condition_price?: Json | null
          updated_at?: string
          verification_source?: string | null
          weight_range?: Json | null
        }
        Relationships: []
      }
      part_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_category_id: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "part_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      part_scans: {
        Row: {
          ai_description: string | null
          analysis_data: Json | null
          condition_assessment: string | null
          confidence_score: number | null
          created_at: string
          detected_brand: string | null
          detected_category: string | null
          detected_oem_numbers: string[] | null
          detected_part_name: string | null
          error_message: string | null
          id: string
          photo_urls: string[]
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
          vehicle_id: string | null
          vehicle_part_id: string | null
        }
        Insert: {
          ai_description?: string | null
          analysis_data?: Json | null
          condition_assessment?: string | null
          confidence_score?: number | null
          created_at?: string
          detected_brand?: string | null
          detected_category?: string | null
          detected_oem_numbers?: string[] | null
          detected_part_name?: string | null
          error_message?: string | null
          id?: string
          photo_urls: string[]
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
          vehicle_part_id?: string | null
        }
        Update: {
          ai_description?: string | null
          analysis_data?: Json | null
          condition_assessment?: string | null
          confidence_score?: number | null
          created_at?: string
          detected_brand?: string | null
          detected_category?: string | null
          detected_oem_numbers?: string[] | null
          detected_part_name?: string | null
          error_message?: string | null
          id?: string
          photo_urls?: string[]
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
          vehicle_part_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_scans_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_scans_vehicle_part_id_fkey"
            columns: ["vehicle_part_id"]
            isOneToOne: false
            referencedRelation: "vehicle_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      part_valuations: {
        Row: {
          confidence_level: string | null
          created_at: string
          currency: string
          estimated_value: number
          factors_considered: Json | null
          id: string
          market_value_max: number | null
          market_value_min: number | null
          notes: string | null
          updated_at: string
          user_id: string
          valid_until: string | null
          valuated_by: string | null
          valuation_date: string
          valuation_method: string
          vehicle_part_id: string
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string
          currency?: string
          estimated_value: number
          factors_considered?: Json | null
          id?: string
          market_value_max?: number | null
          market_value_min?: number | null
          notes?: string | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
          valuated_by?: string | null
          valuation_date?: string
          valuation_method: string
          vehicle_part_id: string
        }
        Update: {
          confidence_level?: string | null
          created_at?: string
          currency?: string
          estimated_value?: number
          factors_considered?: Json | null
          id?: string
          market_value_max?: number | null
          market_value_min?: number | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
          valuated_by?: string | null
          valuation_date?: string
          valuation_method?: string
          vehicle_part_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_valuations_vehicle_part_id_fkey"
            columns: ["vehicle_part_id"]
            isOneToOne: false
            referencedRelation: "vehicle_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_collections: {
        Row: {
          collection_name: string | null
          created_at: string
          id: string
          is_public: boolean | null
          last_viewed_at: string | null
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          collection_name?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          last_viewed_at?: string | null
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          collection_name?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          last_viewed_at?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      rdw_lookups: {
        Row: {
          body_type: string | null
          brand: string
          color: string | null
          created_at: string
          doors: number | null
          engine_capacity: number | null
          engine_code: string | null
          environmental_class: string | null
          first_registration: string | null
          fuel_type: string | null
          id: string
          is_valid: boolean | null
          last_checked: string
          license_plate: string
          model: string
          raw_data: Json | null
          seats: number | null
          technical_approval_date: string | null
          transmission: string | null
          updated_at: string
          variant: string | null
          vin: string | null
          year: number
        }
        Insert: {
          body_type?: string | null
          brand: string
          color?: string | null
          created_at?: string
          doors?: number | null
          engine_capacity?: number | null
          engine_code?: string | null
          environmental_class?: string | null
          first_registration?: string | null
          fuel_type?: string | null
          id?: string
          is_valid?: boolean | null
          last_checked?: string
          license_plate: string
          model: string
          raw_data?: Json | null
          seats?: number | null
          technical_approval_date?: string | null
          transmission?: string | null
          updated_at?: string
          variant?: string | null
          vin?: string | null
          year: number
        }
        Update: {
          body_type?: string | null
          brand?: string
          color?: string | null
          created_at?: string
          doors?: number | null
          engine_capacity?: number | null
          engine_code?: string | null
          environmental_class?: string | null
          first_registration?: string | null
          fuel_type?: string | null
          id?: string
          is_valid?: boolean | null
          last_checked?: string
          license_plate?: string
          model?: string
          raw_data?: Json | null
          seats?: number | null
          technical_approval_date?: string | null
          transmission?: string | null
          updated_at?: string
          variant?: string | null
          vin?: string | null
          year?: number
        }
        Relationships: []
      }
      releases: {
        Row: {
          artist: string
          catalog_number: string | null
          condition_counts: Json | null
          country: string | null
          created_at: string
          discogs_id: number
          discogs_url: string | null
          first_scan_date: string | null
          format: string | null
          genre: string | null
          id: string
          label: string | null
          last_scan_date: string | null
          master_id: number | null
          price_range_max: number | null
          price_range_min: number | null
          style: string[] | null
          title: string
          total_scans: number | null
          updated_at: string
          year: number | null
        }
        Insert: {
          artist: string
          catalog_number?: string | null
          condition_counts?: Json | null
          country?: string | null
          created_at?: string
          discogs_id: number
          discogs_url?: string | null
          first_scan_date?: string | null
          format?: string | null
          genre?: string | null
          id?: string
          label?: string | null
          last_scan_date?: string | null
          master_id?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          style?: string[] | null
          title: string
          total_scans?: number | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          artist?: string
          catalog_number?: string | null
          condition_counts?: Json | null
          country?: string | null
          created_at?: string
          discogs_id?: number
          discogs_url?: string | null
          first_scan_date?: string | null
          format?: string | null
          genre?: string | null
          id?: string
          label?: string | null
          last_scan_date?: string | null
          master_id?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          style?: string[] | null
          title?: string
          total_scans?: number | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      tecdoc_matches: {
        Row: {
          alternative_numbers: string[] | null
          brand: string | null
          category: string | null
          compatible_vehicles: Json
          created_at: string
          id: string
          images: Json | null
          is_active: boolean | null
          last_updated: string
          oem_number: string
          part_name: string
          raw_response: Json | null
          tecdoc_id: string
          technical_specs: Json | null
          updated_at: string
        }
        Insert: {
          alternative_numbers?: string[] | null
          brand?: string | null
          category?: string | null
          compatible_vehicles: Json
          created_at?: string
          id?: string
          images?: Json | null
          is_active?: boolean | null
          last_updated?: string
          oem_number: string
          part_name: string
          raw_response?: Json | null
          tecdoc_id: string
          technical_specs?: Json | null
          updated_at?: string
        }
        Update: {
          alternative_numbers?: string[] | null
          brand?: string | null
          category?: string | null
          compatible_vehicles?: Json
          created_at?: string
          id?: string
          images?: Json | null
          is_active?: boolean | null
          last_updated?: string
          oem_number?: string
          part_name?: string
          raw_response?: Json | null
          tecdoc_id?: string
          technical_specs?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      user_shops: {
        Row: {
          contact_info: string | null
          created_at: string
          id: string
          is_public: boolean | null
          shop_description: string | null
          shop_name: string | null
          shop_url_slug: string | null
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          shop_description?: string | null
          shop_name?: string | null
          shop_url_slug?: string | null
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          shop_description?: string | null
          shop_name?: string | null
          shop_url_slug?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      vehicle_parts: {
        Row: {
          alternative_numbers: string[] | null
          category_id: string | null
          condition_grade: string
          condition_notes: string | null
          created_at: string
          description: string | null
          dimensions: Json | null
          dismantled_by: string | null
          dismantled_date: string | null
          id: string
          name: string
          oem_number: string | null
          photos: string[] | null
          status: string
          storage_location: string | null
          updated_at: string
          user_id: string
          vehicle_id: string
          weight: number | null
        }
        Insert: {
          alternative_numbers?: string[] | null
          category_id?: string | null
          condition_grade: string
          condition_notes?: string | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          dismantled_by?: string | null
          dismantled_date?: string | null
          id?: string
          name: string
          oem_number?: string | null
          photos?: string[] | null
          status?: string
          storage_location?: string | null
          updated_at?: string
          user_id: string
          vehicle_id: string
          weight?: number | null
        }
        Update: {
          alternative_numbers?: string[] | null
          category_id?: string | null
          condition_grade?: string
          condition_notes?: string | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          dismantled_by?: string | null
          dismantled_date?: string | null
          id?: string
          name?: string
          oem_number?: string | null
          photos?: string[] | null
          status?: string
          storage_location?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_parts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "part_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_parts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          body_type: string | null
          brand: string
          color: string | null
          created_at: string
          engine_capacity: number | null
          engine_code: string | null
          entry_date: string
          first_registration: string | null
          fuel_type: string | null
          id: string
          license_plate: string
          mileage: number | null
          model: string
          notes: string | null
          status: string
          transmission_code: string | null
          updated_at: string
          user_id: string
          variant: string | null
          vin: string | null
          yard_location: string | null
          year: number
        }
        Insert: {
          body_type?: string | null
          brand: string
          color?: string | null
          created_at?: string
          engine_capacity?: number | null
          engine_code?: string | null
          entry_date?: string
          first_registration?: string | null
          fuel_type?: string | null
          id?: string
          license_plate: string
          mileage?: number | null
          model: string
          notes?: string | null
          status?: string
          transmission_code?: string | null
          updated_at?: string
          user_id: string
          variant?: string | null
          vin?: string | null
          yard_location?: string | null
          year: number
        }
        Update: {
          body_type?: string | null
          brand?: string
          color?: string | null
          created_at?: string
          engine_capacity?: number | null
          engine_code?: string | null
          entry_date?: string
          first_registration?: string | null
          fuel_type?: string | null
          id?: string
          license_plate?: string
          mileage?: number | null
          model?: string
          notes?: string | null
          status?: string
          transmission_code?: string | null
          updated_at?: string
          user_id?: string
          variant?: string | null
          vin?: string | null
          yard_location?: string | null
          year?: number
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
          is_for_sale: boolean | null
          is_public: boolean | null
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
          release_id: string | null
          shop_description: string | null
          style: string[] | null
          title: string | null
          updated_at: string
          user_id: string
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
          is_for_sale?: boolean | null
          is_public?: boolean | null
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
          release_id?: string | null
          shop_description?: string | null
          style?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
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
          is_for_sale?: boolean | null
          is_public?: boolean | null
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
          release_id?: string | null
          shop_description?: string | null
          style?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vinyl2_scan_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_duplicate_cd_scans: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_duplicate_vinyl_scans: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      extract_and_update_discogs_ids: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      extract_discogs_id_from_url: {
        Args: { url_text: string }
        Returns: number
      }
      find_or_create_release: {
        Args: {
          p_discogs_id: number
          p_artist: string
          p_title: string
          p_label?: string
          p_catalog_number?: string
          p_year?: number
          p_format?: string
          p_genre?: string
          p_country?: string
          p_style?: string[]
          p_discogs_url?: string
          p_master_id?: number
        }
        Returns: string
      }
      update_cd_discogs_ids: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_release_aggregated_data: {
        Args: { release_uuid: string }
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
