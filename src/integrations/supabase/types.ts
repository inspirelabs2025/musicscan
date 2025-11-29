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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_album_reviews: {
        Row: {
          album_title: string
          artist_name: string
          author_name: string | null
          content: string
          cover_image_url: string | null
          created_at: string | null
          format: string | null
          genre: string | null
          id: string
          is_published: boolean | null
          label: string | null
          listening_context: string | null
          published_at: string | null
          rating: number | null
          rating_breakdown: Json | null
          recommended_for: string | null
          release_year: number | null
          slug: string
          spotify_embed_url: string | null
          summary: string
          title: string
          updated_at: string | null
          views_count: number | null
          youtube_embed_url: string | null
        }
        Insert: {
          album_title: string
          artist_name: string
          author_name?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string | null
          format?: string | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          label?: string | null
          listening_context?: string | null
          published_at?: string | null
          rating?: number | null
          rating_breakdown?: Json | null
          recommended_for?: string | null
          release_year?: number | null
          slug: string
          spotify_embed_url?: string | null
          summary: string
          title: string
          updated_at?: string | null
          views_count?: number | null
          youtube_embed_url?: string | null
        }
        Update: {
          album_title?: string
          artist_name?: string
          author_name?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string | null
          format?: string | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          label?: string | null
          listening_context?: string | null
          published_at?: string | null
          rating?: number | null
          rating_breakdown?: Json | null
          recommended_for?: string | null
          release_year?: number | null
          slug?: string
          spotify_embed_url?: string | null
          summary?: string
          title?: string
          updated_at?: string | null
          views_count?: number | null
          youtube_embed_url?: string | null
        }
        Relationships: []
      }
      ai_scan_results: {
        Row: {
          ai_description: string | null
          analysis_data: Json | null
          artist: string | null
          artwork_url: string | null
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
          artwork_url?: string | null
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
          artwork_url?: string | null
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
      album_socks: {
        Row: {
          accent_color: string | null
          album_cover_url: string
          album_title: string
          artist_name: string
          base_design_url: string | null
          color_palette: Json | null
          created_at: string
          description: string | null
          design_theme: string | null
          discogs_id: number | null
          discogs_master_id: number | null
          generation_time_ms: number | null
          genre: string | null
          id: string
          is_published: boolean | null
          mockup_url: string | null
          pattern_type: string | null
          primary_color: string
          product_id: string | null
          release_year: number | null
          secondary_color: string | null
          slug: string
          story_text: string | null
          style_variants: Json | null
          updated_at: string
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          accent_color?: string | null
          album_cover_url: string
          album_title: string
          artist_name: string
          base_design_url?: string | null
          color_palette?: Json | null
          created_at?: string
          description?: string | null
          design_theme?: string | null
          discogs_id?: number | null
          discogs_master_id?: number | null
          generation_time_ms?: number | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          mockup_url?: string | null
          pattern_type?: string | null
          primary_color: string
          product_id?: string | null
          release_year?: number | null
          secondary_color?: string | null
          slug: string
          story_text?: string | null
          style_variants?: Json | null
          updated_at?: string
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          accent_color?: string | null
          album_cover_url?: string
          album_title?: string
          artist_name?: string
          base_design_url?: string | null
          color_palette?: Json | null
          created_at?: string
          description?: string | null
          design_theme?: string | null
          discogs_id?: number | null
          discogs_master_id?: number | null
          generation_time_ms?: number | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          mockup_url?: string | null
          pattern_type?: string | null
          primary_color?: string
          product_id?: string | null
          release_year?: number | null
          secondary_color?: string | null
          slug?: string
          story_text?: string | null
          style_variants?: Json | null
          updated_at?: string
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "album_socks_premium_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "platform_products"
            referencedColumns: ["id"]
          },
        ]
      }
      album_tshirts: {
        Row: {
          accent_color: string | null
          album_cover_url: string
          album_title: string
          artist_name: string
          base_design_url: string | null
          color_palette: Json | null
          created_at: string
          description: string | null
          design_theme: string | null
          discogs_id: number | null
          discogs_master_id: number | null
          generation_time_ms: number | null
          genre: string | null
          id: string
          is_published: boolean | null
          mockup_url: string | null
          pattern_type: string | null
          primary_color: string
          product_id: string | null
          release_year: number | null
          secondary_color: string | null
          slug: string
          story_text: string | null
          style_variants: Json | null
          updated_at: string
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          accent_color?: string | null
          album_cover_url: string
          album_title: string
          artist_name: string
          base_design_url?: string | null
          color_palette?: Json | null
          created_at?: string
          description?: string | null
          design_theme?: string | null
          discogs_id?: number | null
          discogs_master_id?: number | null
          generation_time_ms?: number | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          mockup_url?: string | null
          pattern_type?: string | null
          primary_color: string
          product_id?: string | null
          release_year?: number | null
          secondary_color?: string | null
          slug: string
          story_text?: string | null
          style_variants?: Json | null
          updated_at?: string
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          accent_color?: string | null
          album_cover_url?: string
          album_title?: string
          artist_name?: string
          base_design_url?: string | null
          color_palette?: Json | null
          created_at?: string
          description?: string | null
          design_theme?: string | null
          discogs_id?: number | null
          discogs_master_id?: number | null
          generation_time_ms?: number | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          mockup_url?: string | null
          pattern_type?: string | null
          primary_color?: string
          product_id?: string | null
          release_year?: number | null
          secondary_color?: string | null
          slug?: string
          story_text?: string | null
          style_variants?: Json | null
          updated_at?: string
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      app_secrets: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          secret_key: string
          secret_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          secret_key: string
          secret_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          secret_key?: string
          secret_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      artist_fanwalls: {
        Row: {
          artist_name: string
          canonical_url: string | null
          created_at: string | null
          featured_photo_url: string | null
          id: string
          is_active: boolean | null
          og_image_url: string | null
          photo_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          total_likes: number | null
          total_views: number | null
          updated_at: string | null
        }
        Insert: {
          artist_name: string
          canonical_url?: string | null
          created_at?: string | null
          featured_photo_url?: string | null
          id?: string
          is_active?: boolean | null
          og_image_url?: string | null
          photo_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          total_likes?: number | null
          total_views?: number | null
          updated_at?: string | null
        }
        Update: {
          artist_name?: string
          canonical_url?: string | null
          created_at?: string | null
          featured_photo_url?: string | null
          id?: string
          is_active?: boolean | null
          og_image_url?: string | null
          photo_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          total_likes?: number | null
          total_views?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      artist_stories: {
        Row: {
          artist_name: string
          artwork_url: string | null
          biography: string | null
          created_at: string
          cultural_impact: string | null
          discogs_artist_id: number | null
          featured_products: string[] | null
          id: string
          is_published: boolean | null
          is_spotlight: boolean | null
          meta_description: string | null
          meta_title: string | null
          music_style: string[] | null
          notable_albums: string[] | null
          published_at: string | null
          reading_time: number | null
          slug: string
          spotlight_description: string | null
          spotlight_images: Json | null
          story_content: string
          updated_at: string
          user_id: string | null
          views_count: number | null
          word_count: number | null
        }
        Insert: {
          artist_name: string
          artwork_url?: string | null
          biography?: string | null
          created_at?: string
          cultural_impact?: string | null
          discogs_artist_id?: number | null
          featured_products?: string[] | null
          id?: string
          is_published?: boolean | null
          is_spotlight?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          music_style?: string[] | null
          notable_albums?: string[] | null
          published_at?: string | null
          reading_time?: number | null
          slug: string
          spotlight_description?: string | null
          spotlight_images?: Json | null
          story_content: string
          updated_at?: string
          user_id?: string | null
          views_count?: number | null
          word_count?: number | null
        }
        Update: {
          artist_name?: string
          artwork_url?: string | null
          biography?: string | null
          created_at?: string
          cultural_impact?: string | null
          discogs_artist_id?: number | null
          featured_products?: string[] | null
          id?: string
          is_published?: boolean | null
          is_spotlight?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          music_style?: string[] | null
          notable_albums?: string[] | null
          published_at?: string | null
          reading_time?: number | null
          slug?: string
          spotlight_description?: string | null
          spotlight_images?: Json | null
          story_content?: string
          updated_at?: string
          user_id?: string | null
          views_count?: number | null
          word_count?: number | null
        }
        Relationships: []
      }
      batch_processing_status: {
        Row: {
          auto_mode: boolean | null
          completed_at: string | null
          created_at: string
          current_batch: number | null
          current_items: Json | null
          failed_details: Json | null
          failed_items: number | null
          id: string
          last_heartbeat: string | null
          process_type: string
          processed_items: number | null
          queue_size: number | null
          started_at: string | null
          status: string
          stopped_at: string | null
          successful_items: number | null
          total_items: number | null
          updated_at: string
        }
        Insert: {
          auto_mode?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_batch?: number | null
          current_items?: Json | null
          failed_details?: Json | null
          failed_items?: number | null
          id?: string
          last_heartbeat?: string | null
          process_type: string
          processed_items?: number | null
          queue_size?: number | null
          started_at?: string | null
          status?: string
          stopped_at?: string | null
          successful_items?: number | null
          total_items?: number | null
          updated_at?: string
        }
        Update: {
          auto_mode?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_batch?: number | null
          current_items?: Json | null
          failed_details?: Json | null
          failed_items?: number | null
          id?: string
          last_heartbeat?: string | null
          process_type?: string
          processed_items?: number | null
          queue_size?: number | null
          started_at?: string | null
          status?: string
          stopped_at?: string | null
          successful_items?: number | null
          total_items?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      batch_queue_items: {
        Row: {
          attempts: number
          batch_id: string
          created_at: string
          error_message: string | null
          id: string
          item_id: string
          item_type: string
          max_attempts: number
          metadata: Json | null
          priority: number
          processed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          batch_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          item_id: string
          item_type: string
          max_attempts?: number
          metadata?: Json | null
          priority?: number
          processed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          batch_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          item_id?: string
          item_type?: string
          max_attempts?: number
          metadata?: Json | null
          priority?: number
          processed_at?: string | null
          status?: string
          updated_at?: string
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
      blog_comment_votes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          ai_model: string | null
          blog_post_id: string
          content: string
          created_at: string
          downvotes: number | null
          generation_cost_tokens: number | null
          id: string
          is_ai_generated: boolean | null
          is_flagged: boolean | null
          parent_comment_id: string | null
          updated_at: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          blog_post_id: string
          content: string
          created_at?: string
          downvotes?: number | null
          generation_cost_tokens?: number | null
          id?: string
          is_ai_generated?: boolean | null
          is_flagged?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          blog_post_id?: string
          content?: string
          created_at?: string
          downvotes?: number | null
          generation_cost_tokens?: number | null
          id?: string
          is_ai_generated?: boolean | null
          is_flagged?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      blog_context: {
        Row: {
          ai_model: string | null
          blog_post_id: string
          cached_until: string | null
          created_at: string
          cultural_context: Json | null
          generated_at: string
          historical_events: Json | null
          id: string
          music_scene_context: Json | null
          updated_at: string
        }
        Insert: {
          ai_model?: string | null
          blog_post_id: string
          cached_until?: string | null
          created_at?: string
          cultural_context?: Json | null
          generated_at?: string
          historical_events?: Json | null
          id?: string
          music_scene_context?: Json | null
          updated_at?: string
        }
        Update: {
          ai_model?: string | null
          blog_post_id?: string
          cached_until?: string | null
          created_at?: string
          cultural_context?: Json | null
          generated_at?: string
          historical_events?: Json | null
          id?: string
          music_scene_context?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          album_cover_url: string | null
          album_id: string
          album_type: string
          created_at: string
          id: string
          is_published: boolean | null
          markdown_content: string
          product_card: Json | null
          published_at: string | null
          slug: string
          social_post: string | null
          updated_at: string
          user_id: string
          views_count: number | null
          yaml_frontmatter: Json
        }
        Insert: {
          album_cover_url?: string | null
          album_id: string
          album_type: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          markdown_content: string
          product_card?: Json | null
          published_at?: string | null
          slug: string
          social_post?: string | null
          updated_at?: string
          user_id: string
          views_count?: number | null
          yaml_frontmatter: Json
        }
        Update: {
          album_cover_url?: string | null
          album_id?: string
          album_type?: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          markdown_content?: string
          product_card?: Json | null
          published_at?: string | null
          slug?: string
          social_post?: string | null
          updated_at?: string
          user_id?: string
          views_count?: number | null
          yaml_frontmatter?: Json
        }
        Relationships: []
      }
      blog_reviews: {
        Row: {
          blog_post_id: string
          created_at: string
          helpful_votes: number | null
          id: string
          rating: number
          review_content: string | null
          review_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          blog_post_id: string
          created_at?: string
          helpful_votes?: number | null
          id?: string
          rating: number
          review_content?: string | null
          review_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          blog_post_id?: string
          created_at?: string
          helpful_votes?: number | null
          id?: string
          rating?: number
          review_content?: string | null
          review_title?: string | null
          updated_at?: string
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
          order_id: string | null
          release_id: string | null
          shop_description: string | null
          side: string | null
          sold_at: string | null
          sold_to: string | null
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
          order_id?: string | null
          release_id?: string | null
          shop_description?: string | null
          side?: string | null
          sold_at?: string | null
          sold_to?: string | null
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
          order_id?: string | null
          release_id?: string | null
          shop_description?: string | null
          side?: string | null
          sold_at?: string | null
          sold_to?: string | null
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
      comment_generation_stats: {
        Row: {
          created_at: string | null
          id: string
          last_run_at: string | null
          total_comments_generated: number | null
          total_posts_processed: number | null
          total_tokens_used: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_run_at?: string | null
          total_comments_generated?: number | null
          total_posts_processed?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_run_at?: string | null
          total_comments_generated?: number | null
          total_posts_processed?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "photo_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_muted: boolean | null
          joined_at: string
          last_read_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_group: boolean | null
          last_message_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_group?: boolean | null
          last_message_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_group?: boolean | null
          last_message_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cronjob_execution_log: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          function_name: string
          id: string
          items_processed: number | null
          metadata: Json | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          function_name: string
          id?: string
          items_processed?: number | null
          metadata?: Json | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          function_name?: string
          id?: string
          items_processed?: number | null
          metadata?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      curated_artists: {
        Row: {
          added_at: string | null
          artist_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_crawled_at: string | null
          notes: string | null
          priority: number | null
          releases_found_count: number | null
          updated_at: string | null
        }
        Insert: {
          added_at?: string | null
          artist_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_crawled_at?: string | null
          notes?: string | null
          priority?: number | null
          releases_found_count?: number | null
          updated_at?: string | null
        }
        Update: {
          added_at?: string | null
          artist_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_crawled_at?: string | null
          notes?: string | null
          priority?: number | null
          releases_found_count?: number | null
          updated_at?: string | null
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
      discogs_import_log: {
        Row: {
          artist: string
          blog_id: string | null
          catalog_number: string | null
          country: string | null
          created_at: string | null
          discogs_release_id: number
          error_message: string | null
          format: string | null
          id: string
          import_batch: string | null
          label: string | null
          master_id: number | null
          max_retries: number | null
          processed_at: string | null
          product_id: string | null
          retry_count: number | null
          status: string | null
          title: string
          updated_at: string | null
          year: number | null
        }
        Insert: {
          artist: string
          blog_id?: string | null
          catalog_number?: string | null
          country?: string | null
          created_at?: string | null
          discogs_release_id: number
          error_message?: string | null
          format?: string | null
          id?: string
          import_batch?: string | null
          label?: string | null
          master_id?: number | null
          max_retries?: number | null
          processed_at?: string | null
          product_id?: string | null
          retry_count?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          artist?: string
          blog_id?: string | null
          catalog_number?: string | null
          country?: string | null
          created_at?: string | null
          discogs_release_id?: number
          error_message?: string | null
          format?: string | null
          id?: string
          import_batch?: string | null
          label?: string | null
          master_id?: number | null
          max_retries?: number | null
          processed_at?: string | null
          product_id?: string | null
          retry_count?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discogs_import_log_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discogs_import_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "platform_products"
            referencedColumns: ["id"]
          },
        ]
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
      discogs_releases_shown: {
        Row: {
          artist: string
          created_at: string | null
          discogs_id: number
          first_shown_at: string | null
          id: string
          is_hidden: boolean | null
          last_seen_at: string | null
          times_shown: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          artist: string
          created_at?: string | null
          discogs_id: number
          first_shown_at?: string | null
          id?: string
          is_hidden?: boolean | null
          last_seen_at?: string | null
          times_shown?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          artist?: string
          created_at?: string | null
          discogs_id?: number
          first_shown_at?: string | null
          id?: string
          is_hidden?: boolean | null
          last_seen_at?: string | null
          times_shown?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      echo_conversations: {
        Row: {
          conversation_type: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          metadata: Json | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      echo_messages: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          message: string
          message_type: string | null
          metadata: Json | null
          response_time_ms: number | null
          sender_type: string
          tokens_used: number | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          message_type?: string | null
          metadata?: Json | null
          response_time_ms?: number | null
          sender_type: string
          tokens_used?: number | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          message_type?: string | null
          metadata?: Json | null
          response_time_ms?: number | null
          sender_type?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "echo_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "echo_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_user_preferences: {
        Row: {
          created_at: string | null
          favorite_genres: string[] | null
          language: string | null
          tone_preference: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          favorite_genres?: string[] | null
          language?: string | null
          tone_preference?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          favorite_genres?: string[] | null
          language?: string | null
          tone_preference?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          resend_id: string | null
          sent_at: string
          status: string
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          resend_id?: string | null
          sent_at?: string
          status?: string
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          resend_id?: string | null
          sent_at?: string
          status?: string
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          config: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_html: string | null
          template_type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          preview_html?: string | null
          template_type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_html?: string | null
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      facebook_auto_post_settings: {
        Row: {
          content_type: string
          created_at: string
          custom_hashtags: string[] | null
          id: string
          include_image: boolean | null
          include_url: boolean | null
          is_enabled: boolean
          last_auto_post_at: string | null
          max_posts_per_day: number | null
          schedule_day: number | null
          schedule_hour: number | null
          schedule_type: string
          updated_at: string
        }
        Insert: {
          content_type: string
          created_at?: string
          custom_hashtags?: string[] | null
          id?: string
          include_image?: boolean | null
          include_url?: boolean | null
          is_enabled?: boolean
          last_auto_post_at?: string | null
          max_posts_per_day?: number | null
          schedule_day?: number | null
          schedule_hour?: number | null
          schedule_type?: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          custom_hashtags?: string[] | null
          id?: string
          include_image?: boolean | null
          include_url?: boolean | null
          is_enabled?: boolean
          last_auto_post_at?: string | null
          max_posts_per_day?: number | null
          schedule_day?: number | null
          schedule_hour?: number | null
          schedule_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      facebook_content_queue: {
        Row: {
          content_id: string
          content_preview: string | null
          content_type: string
          created_at: string
          created_by: string | null
          error_message: string | null
          facebook_post_id: string | null
          id: string
          image_url: string | null
          posted_at: string | null
          scheduled_for: string | null
          status: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          content_id: string
          content_preview?: string | null
          content_type: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          facebook_post_id?: string | null
          id?: string
          image_url?: string | null
          posted_at?: string | null
          scheduled_for?: string | null
          status?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          content_id?: string
          content_preview?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          facebook_post_id?: string | null
          id?: string
          image_url?: string | null
          posted_at?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      facebook_post_log: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          error_message: string | null
          facebook_post_id: string | null
          facebook_response: Json | null
          id: string
          image_url: string | null
          posted_at: string | null
          status: string
          title: string | null
          url: string | null
        }
        Insert: {
          content?: string | null
          content_type: string
          created_at?: string
          error_message?: string | null
          facebook_post_id?: string | null
          facebook_response?: Json | null
          id?: string
          image_url?: string | null
          posted_at?: string | null
          status?: string
          title?: string | null
          url?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          error_message?: string | null
          facebook_post_id?: string | null
          facebook_response?: Json | null
          id?: string
          image_url?: string | null
          posted_at?: string | null
          status?: string
          title?: string | null
          url?: string | null
        }
        Relationships: []
      }
      facebook_sync_log: {
        Row: {
          created_at: string | null
          error_details: Json | null
          id: string
          products_failed: number | null
          products_synced: number | null
          status: string
          sync_completed_at: string | null
          sync_started_at: string
          sync_type: string | null
          total_products: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_details?: Json | null
          id?: string
          products_failed?: number | null
          products_synced?: number | null
          status?: string
          sync_completed_at?: string | null
          sync_started_at?: string
          sync_type?: string | null
          total_products?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_details?: Json | null
          id?: string
          products_failed?: number | null
          products_synced?: number | null
          status?: string
          sync_completed_at?: string | null
          sync_started_at?: string
          sync_type?: string | null
          total_products?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      forum_post_votes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          content: string
          created_at: string
          downvotes: number | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          parent_post_id: string | null
          topic_id: string
          updated_at: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          downvotes?: number | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          parent_post_id?: string | null
          topic_id: string
          updated_at?: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          downvotes?: number | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          parent_post_id?: string | null
          topic_id?: string
          updated_at?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topic_subscriptions: {
        Row: {
          created_at: string
          id: string
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_topic_subscriptions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          album_title: string | null
          artist_name: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_featured: boolean | null
          is_pinned: boolean | null
          reply_count: number | null
          status: string
          title: string
          topic_type: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          album_title?: string | null
          artist_name?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_pinned?: boolean | null
          reply_count?: number | null
          status?: string
          title: string
          topic_type?: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          album_title?: string | null
          artist_name?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_pinned?: boolean | null
          reply_count?: number | null
          status?: string
          title?: string
          topic_type?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      indexnow_queue: {
        Row: {
          content_type: string
          created_at: string
          id: string
          processed: boolean | null
          processed_at: string | null
          url: string
        }
        Insert: {
          content_type: string
          created_at?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          url: string
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          url?: string
        }
        Relationships: []
      }
      indexnow_submissions: {
        Row: {
          content_type: string
          created_at: string
          id: string
          response_body: string | null
          status_code: number | null
          submitted_at: string
          urls: string[]
        }
        Insert: {
          content_type: string
          created_at?: string
          id?: string
          response_body?: string | null
          status_code?: number | null
          submitted_at?: string
          urls: string[]
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          response_body?: string | null
          status_code?: number | null
          submitted_at?: string
          urls?: string[]
        }
        Relationships: []
      }
      lyric_posters: {
        Row: {
          album_name: string | null
          artist_name: string
          color_palette: Json | null
          copyright_notes: string | null
          copyright_status: string | null
          created_at: string
          full_lyrics: string
          highlight_lines: string
          id: string
          is_published: boolean | null
          license_type: string | null
          metal_product_id: string | null
          poster_url: string | null
          qr_code_url: string | null
          release_year: number | null
          slug: string | null
          song_title: string
          standard_product_id: string | null
          style_preset: string | null
          style_variants: Json | null
          typography_hint: string | null
          updated_at: string
          user_id: string | null
          user_license_confirmed: boolean | null
        }
        Insert: {
          album_name?: string | null
          artist_name: string
          color_palette?: Json | null
          copyright_notes?: string | null
          copyright_status?: string | null
          created_at?: string
          full_lyrics: string
          highlight_lines: string
          id?: string
          is_published?: boolean | null
          license_type?: string | null
          metal_product_id?: string | null
          poster_url?: string | null
          qr_code_url?: string | null
          release_year?: number | null
          slug?: string | null
          song_title: string
          standard_product_id?: string | null
          style_preset?: string | null
          style_variants?: Json | null
          typography_hint?: string | null
          updated_at?: string
          user_id?: string | null
          user_license_confirmed?: boolean | null
        }
        Update: {
          album_name?: string | null
          artist_name?: string
          color_palette?: Json | null
          copyright_notes?: string | null
          copyright_status?: string | null
          created_at?: string
          full_lyrics?: string
          highlight_lines?: string
          id?: string
          is_published?: boolean | null
          license_type?: string | null
          metal_product_id?: string | null
          poster_url?: string | null
          qr_code_url?: string | null
          release_year?: number | null
          slug?: string | null
          song_title?: string
          standard_product_id?: string | null
          style_preset?: string | null
          style_variants?: Json | null
          typography_hint?: string | null
          updated_at?: string
          user_id?: string | null
          user_license_confirmed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "lyric_posters_metal_product_id_fkey"
            columns: ["metal_product_id"]
            isOneToOne: false
            referencedRelation: "platform_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lyric_posters_standard_product_id_fkey"
            columns: ["standard_product_id"]
            isOneToOne: false
            referencedRelation: "platform_products"
            referencedColumns: ["id"]
          },
        ]
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
      media_library: {
        Row: {
          ai_context_type: string | null
          ai_description: string | null
          ai_reasoning: string | null
          ai_status: string | null
          ai_tags: string[] | null
          alternative_artists: string[] | null
          artist_confidence: number | null
          created_at: string | null
          file_name: string
          file_size: number | null
          height: number | null
          id: string
          manual_artist: string | null
          manual_tags: string[] | null
          mime_type: string | null
          notes: string | null
          public_url: string
          recognized_artist: string | null
          sent_to_buttons: boolean | null
          sent_to_canvas: boolean | null
          sent_to_fanwall: boolean | null
          sent_to_posters: boolean | null
          sent_to_socks: boolean | null
          sent_to_tshirts: boolean | null
          storage_bucket: string | null
          storage_path: string
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string | null
          width: number | null
        }
        Insert: {
          ai_context_type?: string | null
          ai_description?: string | null
          ai_reasoning?: string | null
          ai_status?: string | null
          ai_tags?: string[] | null
          alternative_artists?: string[] | null
          artist_confidence?: number | null
          created_at?: string | null
          file_name: string
          file_size?: number | null
          height?: number | null
          id?: string
          manual_artist?: string | null
          manual_tags?: string[] | null
          mime_type?: string | null
          notes?: string | null
          public_url: string
          recognized_artist?: string | null
          sent_to_buttons?: boolean | null
          sent_to_canvas?: boolean | null
          sent_to_fanwall?: boolean | null
          sent_to_posters?: boolean | null
          sent_to_socks?: boolean | null
          sent_to_tshirts?: boolean | null
          storage_bucket?: string | null
          storage_path: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          width?: number | null
        }
        Update: {
          ai_context_type?: string | null
          ai_description?: string | null
          ai_reasoning?: string | null
          ai_status?: string | null
          ai_tags?: string[] | null
          alternative_artists?: string[] | null
          artist_confidence?: number | null
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          height?: number | null
          id?: string
          manual_artist?: string | null
          manual_tags?: string[] | null
          mime_type?: string | null
          notes?: string | null
          public_url?: string
          recognized_artist?: string | null
          sent_to_buttons?: boolean | null
          sent_to_canvas?: boolean | null
          sent_to_fanwall?: boolean | null
          sent_to_posters?: boolean | null
          sent_to_socks?: boolean | null
          sent_to_tshirts?: boolean | null
          storage_bucket?: string | null
          storage_path?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          width?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_edited: boolean | null
          message_type: string | null
          metadata: Json | null
          replied_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          replied_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          replied_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_replied_to_id_fkey"
            columns: ["replied_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      music_anecdotes: {
        Row: {
          anecdote_content: string
          anecdote_date: string
          anecdote_title: string
          created_at: string
          extended_content: string | null
          id: string
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          reading_time: number | null
          slug: string | null
          source_reference: string | null
          subject_details: Json | null
          subject_name: string
          subject_type: string
          views_count: number | null
        }
        Insert: {
          anecdote_content: string
          anecdote_date: string
          anecdote_title: string
          created_at?: string
          extended_content?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          reading_time?: number | null
          slug?: string | null
          source_reference?: string | null
          subject_details?: Json | null
          subject_name: string
          subject_type: string
          views_count?: number | null
        }
        Update: {
          anecdote_content?: string
          anecdote_date?: string
          anecdote_title?: string
          created_at?: string
          extended_content?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          reading_time?: number | null
          slug?: string | null
          source_reference?: string | null
          subject_details?: Json | null
          subject_name?: string
          subject_type?: string
          views_count?: number | null
        }
        Relationships: []
      }
      music_history_events: {
        Row: {
          created_at: string
          day_of_month: number
          event_date: string
          events: Json
          generated_at: string
          id: string
          month_of_year: number
        }
        Insert: {
          created_at?: string
          day_of_month: number
          event_date: string
          events: Json
          generated_at?: string
          id?: string
          month_of_year: number
        }
        Update: {
          created_at?: string
          day_of_month?: number
          event_date?: string
          events?: Json
          generated_at?: string
          id?: string
          month_of_year?: number
        }
        Relationships: []
      }
      music_stories: {
        Row: {
          album: string | null
          artist: string | null
          artwork_url: string | null
          catalog: string | null
          created_at: string
          genre: string | null
          id: string
          is_published: boolean
          label: string | null
          meta_description: string | null
          meta_title: string | null
          query: string
          reading_time: number | null
          single_name: string | null
          slug: string
          social_post: string | null
          story_content: string
          styles: string[] | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          views_count: number | null
          word_count: number | null
          yaml_frontmatter: Json | null
          year: number | null
        }
        Insert: {
          album?: string | null
          artist?: string | null
          artwork_url?: string | null
          catalog?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          is_published?: boolean
          label?: string | null
          meta_description?: string | null
          meta_title?: string | null
          query: string
          reading_time?: number | null
          single_name?: string | null
          slug: string
          social_post?: string | null
          story_content: string
          styles?: string[] | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number | null
          word_count?: number | null
          yaml_frontmatter?: Json | null
          year?: number | null
        }
        Update: {
          album?: string | null
          artist?: string | null
          artwork_url?: string | null
          catalog?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          is_published?: boolean
          label?: string | null
          meta_description?: string | null
          meta_title?: string | null
          query?: string
          reading_time?: number | null
          single_name?: string | null
          slug?: string
          social_post?: string | null
          story_content?: string
          styles?: string[] | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number | null
          word_count?: number | null
          yaml_frontmatter?: Json | null
          year?: number | null
        }
        Relationships: []
      }
      news_blog_posts: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          published_at: string
          slug: string
          source: string
          summary: string
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          author?: string
          category: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          published_at: string
          slug: string
          source: string
          summary: string
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string
          slug?: string
          source?: string
          summary?: string
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: []
      }
      news_cache: {
        Row: {
          cached_at: string
          content: Json
          created_at: string
          expires_at: string
          id: string
          source: string
          updated_at: string
        }
        Insert: {
          cached_at?: string
          content: Json
          created_at?: string
          expires_at?: string
          id?: string
          source: string
          updated_at?: string
        }
        Update: {
          cached_at?: string
          content?: Json
          created_at?: string
          expires_at?: string
          id?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_generation_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          items_failed: number | null
          items_processed: number | null
          source: string
          status: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          source: string
          status: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      news_rss_feeds: {
        Row: {
          articles_fetched_count: number | null
          category: string | null
          created_at: string | null
          feed_name: string
          feed_url: string
          id: string
          is_active: boolean | null
          last_fetched_at: string | null
          updated_at: string | null
        }
        Insert: {
          articles_fetched_count?: number | null
          category?: string | null
          created_at?: string | null
          feed_name: string
          feed_url: string
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          updated_at?: string | null
        }
        Update: {
          articles_fetched_count?: number | null
          category?: string | null
          created_at?: string | null
          feed_name?: string
          feed_url?: string
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          id: string
          is_read: boolean
          photo_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          photo_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          photo_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "photo_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "featured_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
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
      photo_batch_queue: {
        Row: {
          completed_at: string | null
          completed_jobs: number
          created_at: string | null
          current_job: string | null
          id: string
          photo_url: string
          results: Json | null
          status: string
          total_jobs: number
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_jobs?: number
          created_at?: string | null
          current_job?: string | null
          id?: string
          photo_url: string
          results?: Json | null
          status?: string
          total_jobs?: number
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_jobs?: number
          created_at?: string | null
          current_job?: string | null
          id?: string
          photo_url?: string
          results?: Json | null
          status?: string
          total_jobs?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      photo_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          like_count: number
          parent_comment_id: string | null
          photo_id: string
          status: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          like_count?: number
          parent_comment_id?: string | null
          photo_id: string
          status?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          like_count?: number
          parent_comment_id?: string | null
          photo_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "photo_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "featured_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_likes: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "featured_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_views: {
        Row: {
          id: string
          ip_address: string | null
          photo_id: string
          user_agent: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          photo_id: string
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          photo_id?: string
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_views_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "featured_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_views_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          album: string | null
          artist: string | null
          canonical_url: string | null
          caption: string | null
          city: string | null
          comment_count: number | null
          country: string | null
          created_at: string
          display_url: string
          event_date: string | null
          flagged_count: number | null
          format: string | null
          height: number | null
          id: string
          license_granted: boolean | null
          like_count: number | null
          og_image_url: string | null
          original_url: string
          print_allowed: boolean | null
          published_at: string | null
          seo_description: string | null
          seo_slug: string | null
          seo_title: string | null
          source_type: string
          status: string
          tags: string[] | null
          user_id: string
          venue: string | null
          view_count: number | null
          width: number | null
          year: number | null
        }
        Insert: {
          album?: string | null
          artist?: string | null
          canonical_url?: string | null
          caption?: string | null
          city?: string | null
          comment_count?: number | null
          country?: string | null
          created_at?: string
          display_url: string
          event_date?: string | null
          flagged_count?: number | null
          format?: string | null
          height?: number | null
          id?: string
          license_granted?: boolean | null
          like_count?: number | null
          og_image_url?: string | null
          original_url: string
          print_allowed?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_slug?: string | null
          seo_title?: string | null
          source_type?: string
          status?: string
          tags?: string[] | null
          user_id: string
          venue?: string | null
          view_count?: number | null
          width?: number | null
          year?: number | null
        }
        Update: {
          album?: string | null
          artist?: string | null
          canonical_url?: string | null
          caption?: string | null
          city?: string | null
          comment_count?: number | null
          country?: string | null
          created_at?: string
          display_url?: string
          event_date?: string | null
          flagged_count?: number | null
          format?: string | null
          height?: number | null
          id?: string
          license_granted?: boolean | null
          like_count?: number | null
          og_image_url?: string | null
          original_url?: string
          print_allowed?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_slug?: string | null
          seo_title?: string | null
          source_type?: string
          status?: string
          tags?: string[] | null
          user_id?: string
          venue?: string | null
          view_count?: number | null
          width?: number | null
          year?: number | null
        }
        Relationships: []
      }
      platform_order_items: {
        Row: {
          artist: string | null
          created_at: string | null
          id: string
          order_id: string | null
          price: number
          product_id: string | null
          product_snapshot: Json | null
          quantity: number
          title: string
        }
        Insert: {
          artist?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          price: number
          product_id?: string | null
          product_snapshot?: Json | null
          quantity?: number
          title: string
        }
        Update: {
          artist?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          price?: number
          product_id?: string | null
          product_snapshot?: Json | null
          quantity?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "platform_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "platform_products"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_orders: {
        Row: {
          admin_note: string | null
          billing_address: Json | null
          carrier: string | null
          created_at: string | null
          currency: string | null
          customer_email: string
          customer_id: string | null
          customer_name: string | null
          customer_note: string | null
          delivered_at: string | null
          id: string
          order_number: string
          paid_at: string | null
          payment_status: string | null
          shipped_at: string | null
          shipping_address: Json
          shipping_cost: number | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          tax: number | null
          total: number
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          billing_address?: Json | null
          carrier?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email: string
          customer_id?: string | null
          customer_name?: string | null
          customer_note?: string | null
          delivered_at?: string | null
          id?: string
          order_number: string
          paid_at?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_address: Json
          shipping_cost?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal: number
          tax?: number | null
          total: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          billing_address?: Json | null
          carrier?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_note?: string | null
          delivered_at?: string | null
          id?: string
          order_number?: string
          paid_at?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_address?: Json
          shipping_cost?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_products: {
        Row: {
          allow_backorder: boolean | null
          artist: string | null
          catalog_number: string | null
          categories: string[] | null
          compare_at_price: number | null
          condition_grade: string | null
          cost_price: number | null
          country: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          discogs_id: number | null
          discogs_url: string | null
          edition_number: number | null
          featured_until: string | null
          format: string | null
          genre: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          is_new: boolean | null
          is_on_sale: boolean | null
          label: string | null
          last_purchased_at: string | null
          last_viewed_at: string | null
          long_description: string | null
          low_stock_threshold: number | null
          master_id: number | null
          media_type: string
          meta_description: string | null
          meta_title: string | null
          metadata: Json | null
          price: number
          primary_image: string | null
          published_at: string | null
          purchase_count: number | null
          qr_code_data: string | null
          release_id: string | null
          sku: string | null
          slug: string
          status: string | null
          stock_quantity: number
          tags: string[] | null
          time_machine_event_id: string | null
          title: string
          updated_at: string | null
          view_count: number | null
          year: number | null
        }
        Insert: {
          allow_backorder?: boolean | null
          artist?: string | null
          catalog_number?: string | null
          categories?: string[] | null
          compare_at_price?: number | null
          condition_grade?: string | null
          cost_price?: number | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          discogs_id?: number | null
          discogs_url?: string | null
          edition_number?: number | null
          featured_until?: string | null
          format?: string | null
          genre?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_on_sale?: boolean | null
          label?: string | null
          last_purchased_at?: string | null
          last_viewed_at?: string | null
          long_description?: string | null
          low_stock_threshold?: number | null
          master_id?: number | null
          media_type: string
          meta_description?: string | null
          meta_title?: string | null
          metadata?: Json | null
          price: number
          primary_image?: string | null
          published_at?: string | null
          purchase_count?: number | null
          qr_code_data?: string | null
          release_id?: string | null
          sku?: string | null
          slug: string
          status?: string | null
          stock_quantity?: number
          tags?: string[] | null
          time_machine_event_id?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
          year?: number | null
        }
        Update: {
          allow_backorder?: boolean | null
          artist?: string | null
          catalog_number?: string | null
          categories?: string[] | null
          compare_at_price?: number | null
          condition_grade?: string | null
          cost_price?: number | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          discogs_id?: number | null
          discogs_url?: string | null
          edition_number?: number | null
          featured_until?: string | null
          format?: string | null
          genre?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_on_sale?: boolean | null
          label?: string | null
          last_purchased_at?: string | null
          last_viewed_at?: string | null
          long_description?: string | null
          low_stock_threshold?: number | null
          master_id?: number | null
          media_type?: string
          meta_description?: string | null
          meta_title?: string | null
          metadata?: Json | null
          price?: number
          primary_image?: string | null
          published_at?: string | null
          purchase_count?: number | null
          qr_code_data?: string | null
          release_id?: string | null
          sku?: string | null
          slug?: string
          status?: string | null
          stock_quantity?: number
          tags?: string[] | null
          time_machine_event_id?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_products_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_products_time_machine_event_id_fkey"
            columns: ["time_machine_event_id"]
            isOneToOne: false
            referencedRelation: "time_machine_events"
            referencedColumns: ["id"]
          },
        ]
      }
      poster_processing_queue: {
        Row: {
          artist_name: string
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          processed_at: string | null
          product_id: string | null
          retry_count: number | null
          status: string | null
          storage_path: string
          updated_at: string | null
        }
        Insert: {
          artist_name: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          processed_at?: string | null
          product_id?: string | null
          retry_count?: number | null
          status?: string | null
          storage_path: string
          updated_at?: string | null
        }
        Update: {
          artist_name?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          processed_at?: string | null
          product_id?: string | null
          retry_count?: number | null
          status?: string | null
          storage_path?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poster_processing_queue_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "platform_products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_change_log: {
        Row: {
          blog_post_updated: boolean | null
          changed_at: string
          created_at: string
          discogs_id: number | null
          id: string
          new_price: number | null
          old_price: number | null
          price_change_percent: number | null
          scan_id: string
          scan_type: string
        }
        Insert: {
          blog_post_updated?: boolean | null
          changed_at?: string
          created_at?: string
          discogs_id?: number | null
          id?: string
          new_price?: number | null
          old_price?: number | null
          price_change_percent?: number | null
          scan_id: string
          scan_type: string
        }
        Update: {
          blog_post_updated?: boolean | null
          changed_at?: string
          created_at?: string
          discogs_id?: number | null
          id?: string
          new_price?: number | null
          old_price?: number | null
          price_change_percent?: number | null
          scan_id?: string
          scan_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allow_messages: boolean | null
          auto_blog_generation: boolean | null
          avatar_url: string | null
          bio: string | null
          collection_views: number
          created_at: string
          email_notifications: boolean | null
          first_name: string
          id: string
          is_bot: boolean | null
          is_public: boolean | null
          last_active_at: string | null
          last_onboarding_at: string | null
          location: string | null
          onboarding_completed: boolean | null
          onboarding_skipped: boolean | null
          onboarding_step: number | null
          show_activity: boolean | null
          show_collection: boolean | null
          spotify_connected: boolean | null
          spotify_display_name: string | null
          spotify_email: string | null
          spotify_last_sync: string | null
          spotify_refresh_token: string | null
          spotify_sync_enabled: boolean | null
          spotify_user_id: string | null
          total_followers: number | null
          total_following: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          allow_messages?: boolean | null
          auto_blog_generation?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          collection_views?: number
          created_at?: string
          email_notifications?: boolean | null
          first_name: string
          id?: string
          is_bot?: boolean | null
          is_public?: boolean | null
          last_active_at?: string | null
          last_onboarding_at?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          onboarding_skipped?: boolean | null
          onboarding_step?: number | null
          show_activity?: boolean | null
          show_collection?: boolean | null
          spotify_connected?: boolean | null
          spotify_display_name?: string | null
          spotify_email?: string | null
          spotify_last_sync?: string | null
          spotify_refresh_token?: string | null
          spotify_sync_enabled?: boolean | null
          spotify_user_id?: string | null
          total_followers?: number | null
          total_following?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          allow_messages?: boolean | null
          auto_blog_generation?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          collection_views?: number
          created_at?: string
          email_notifications?: boolean | null
          first_name?: string
          id?: string
          is_bot?: boolean | null
          is_public?: boolean | null
          last_active_at?: string | null
          last_onboarding_at?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          onboarding_skipped?: boolean | null
          onboarding_step?: number | null
          show_activity?: boolean | null
          show_collection?: boolean | null
          spotify_connected?: boolean | null
          spotify_display_name?: string | null
          spotify_email?: string | null
          spotify_last_sync?: string | null
          spotify_refresh_token?: string | null
          spotify_sync_enabled?: boolean | null
          spotify_user_id?: string | null
          total_followers?: number | null
          total_following?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
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
      quiz_results: {
        Row: {
          created_at: string
          id: string
          questions_correct: number
          questions_total: number
          quiz_data: Json | null
          quiz_type: string
          score_percentage: number
          time_taken_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          questions_correct: number
          questions_total: number
          quiz_data?: Json | null
          quiz_type?: string
          score_percentage: number
          time_taken_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          questions_correct?: number
          questions_total?: number
          quiz_data?: Json | null
          quiz_type?: string
          score_percentage?: number
          time_taken_seconds?: number | null
          updated_at?: string
          user_id?: string
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
          artwork_url: string | null
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
          artwork_url?: string | null
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
          artwork_url?: string | null
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
      rss_feed_episodes: {
        Row: {
          audio_url: string
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          episode_number: number | null
          file_size: number | null
          guid: string | null
          id: string
          is_featured: boolean | null
          mime_type: string | null
          published_date: string | null
          season_number: number | null
          show_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          file_size?: number | null
          guid?: string | null
          id?: string
          is_featured?: boolean | null
          mime_type?: string | null
          published_date?: string | null
          season_number?: number | null
          show_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          file_size?: number | null
          guid?: string | null
          id?: string
          is_featured?: boolean | null
          mime_type?: string | null
          published_date?: string | null
          season_number?: number | null
          show_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rss_feed_episodes_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "spotify_curated_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_order_items: {
        Row: {
          created_at: string
          id: string
          item_data: Json | null
          item_id: string
          item_type: string
          order_id: string
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_data?: Json | null
          item_id: string
          item_type: string
          order_id: string
          price: number
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_data?: Json | null
          item_id?: string
          item_type?: string
          order_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          buyer_email: string | null
          buyer_id: string | null
          buyer_name: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          payment_status: string
          seller_id: string
          shipping_address: Json | null
          shipping_cost: number | null
          status: string
          stripe_payment_intent_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_email?: string | null
          buyer_id?: string | null
          buyer_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_status?: string
          seller_id: string
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          buyer_email?: string | null
          buyer_id?: string | null
          buyer_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_status?: string
          seller_id?: string
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      shop_products: {
        Row: {
          admin_user_id: string
          category: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          metadata: Json | null
          name: string
          price: number
          shipping_cost: number | null
          stock_quantity: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          admin_user_id: string
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          price: number
          shipping_cost?: number | null
          stock_quantity?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          admin_user_id?: string
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          price?: number
          shipping_cost?: number | null
          stock_quantity?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      shop_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string
          payment_method: string | null
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          payment_method?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          payment_method?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      singles_import_queue: {
        Row: {
          album: string | null
          artist: string
          artwork_url: string | null
          attempts: number | null
          batch_id: string
          catalog: string | null
          created_at: string | null
          discogs_id: number | null
          discogs_url: string | null
          error_message: string | null
          genre: string | null
          id: string
          label: string | null
          max_attempts: number | null
          music_story_id: string | null
          priority: number | null
          processed_at: string | null
          single_name: string
          status: string
          styles: string[] | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          album?: string | null
          artist: string
          artwork_url?: string | null
          attempts?: number | null
          batch_id: string
          catalog?: string | null
          created_at?: string | null
          discogs_id?: number | null
          discogs_url?: string | null
          error_message?: string | null
          genre?: string | null
          id?: string
          label?: string | null
          max_attempts?: number | null
          music_story_id?: string | null
          priority?: number | null
          processed_at?: string | null
          single_name: string
          status?: string
          styles?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          album?: string | null
          artist?: string
          artwork_url?: string | null
          attempts?: number | null
          batch_id?: string
          catalog?: string | null
          created_at?: string | null
          discogs_id?: number | null
          discogs_url?: string | null
          error_message?: string | null
          genre?: string | null
          id?: string
          label?: string | null
          max_attempts?: number | null
          music_story_id?: string | null
          priority?: number | null
          processed_at?: string | null
          single_name?: string
          status?: string
          styles?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "singles_import_queue_music_story_id_fkey"
            columns: ["music_story_id"]
            isOneToOne: false
            referencedRelation: "music_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      sitemap_logs: {
        Row: {
          created_at: string | null
          file: string | null
          id: number
          method: string | null
          note: string | null
          path: string | null
          size_bytes: number | null
          status_code: number | null
        }
        Insert: {
          created_at?: string | null
          file?: string | null
          id?: number
          method?: string | null
          note?: string | null
          path?: string | null
          size_bytes?: number | null
          status_code?: number | null
        }
        Update: {
          created_at?: string | null
          file?: string | null
          id?: number
          method?: string | null
          note?: string | null
          path?: string | null
          size_bytes?: number | null
          status_code?: number | null
        }
        Relationships: []
      }
      sitemap_regeneration_log: {
        Row: {
          completed_at: string | null
          content_id: string | null
          content_slug: string | null
          content_type: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          gsc_response: Json | null
          gsc_submitted: boolean | null
          health_checks: Json | null
          id: string
          sitemaps_updated: string[] | null
          started_at: string | null
          status: string | null
          trigger_source: string
        }
        Insert: {
          completed_at?: string | null
          content_id?: string | null
          content_slug?: string | null
          content_type?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          gsc_response?: Json | null
          gsc_submitted?: boolean | null
          health_checks?: Json | null
          id?: string
          sitemaps_updated?: string[] | null
          started_at?: string | null
          status?: string | null
          trigger_source: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string | null
          content_slug?: string | null
          content_type?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          gsc_response?: Json | null
          gsc_submitted?: boolean | null
          health_checks?: Json | null
          id?: string
          sitemaps_updated?: string[] | null
          started_at?: string | null
          status?: string | null
          trigger_source?: string
        }
        Relationships: []
      }
      sitemap_regeneration_queue: {
        Row: {
          content_id: string
          content_slug: string | null
          content_type: string
          id: string
          processed_at: string | null
          queued_at: string | null
          status: string | null
        }
        Insert: {
          content_id: string
          content_slug?: string | null
          content_type: string
          id?: string
          processed_at?: string | null
          queued_at?: string | null
          status?: string | null
        }
        Update: {
          content_id?: string
          content_slug?: string | null
          content_type?: string
          id?: string
          processed_at?: string | null
          queued_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      spotify_curated_shows: {
        Row: {
          category: string | null
          created_at: string
          curator_notes: string | null
          description: string | null
          feed_type: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          last_rss_sync: string | null
          name: string
          publisher: string | null
          rss_feed_url: string | null
          spotify_show_id: string
          spotify_url: string | null
          total_episodes: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          curator_notes?: string | null
          description?: string | null
          feed_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          last_rss_sync?: string | null
          name: string
          publisher?: string | null
          rss_feed_url?: string | null
          spotify_show_id: string
          spotify_url?: string | null
          total_episodes?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          curator_notes?: string | null
          description?: string | null
          feed_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          last_rss_sync?: string | null
          name?: string
          publisher?: string | null
          rss_feed_url?: string | null
          spotify_show_id?: string
          spotify_url?: string | null
          total_episodes?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      spotify_individual_episodes: {
        Row: {
          audio_preview_url: string | null
          category: string | null
          created_at: string
          curator_notes: string | null
          description: string | null
          duration_ms: number | null
          id: string
          is_featured: boolean | null
          name: string
          release_date: string | null
          show_name: string
          spotify_episode_id: string
          spotify_url: string
          updated_at: string
        }
        Insert: {
          audio_preview_url?: string | null
          category?: string | null
          created_at?: string
          curator_notes?: string | null
          description?: string | null
          duration_ms?: number | null
          id?: string
          is_featured?: boolean | null
          name: string
          release_date?: string | null
          show_name: string
          spotify_episode_id: string
          spotify_url: string
          updated_at?: string
        }
        Update: {
          audio_preview_url?: string | null
          category?: string | null
          created_at?: string
          curator_notes?: string | null
          description?: string | null
          duration_ms?: number | null
          id?: string
          is_featured?: boolean | null
          name?: string
          release_date?: string | null
          show_name?: string
          spotify_episode_id?: string
          spotify_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      spotify_new_releases_processed: {
        Row: {
          album_name: string
          artist: string
          blog_id: string | null
          created_at: string
          discogs_id: number | null
          error_message: string | null
          id: string
          image_url: string | null
          processed_at: string | null
          product_id: string | null
          release_date: string | null
          spotify_album_id: string
          spotify_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          album_name: string
          artist: string
          blog_id?: string | null
          created_at?: string
          discogs_id?: number | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          processed_at?: string | null
          product_id?: string | null
          release_date?: string | null
          spotify_album_id: string
          spotify_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          album_name?: string
          artist?: string
          blog_id?: string | null
          created_at?: string
          discogs_id?: number | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          processed_at?: string | null
          product_id?: string | null
          release_date?: string | null
          spotify_album_id?: string
          spotify_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotify_new_releases_processed_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotify_new_releases_processed_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "platform_products"
            referencedColumns: ["id"]
          },
        ]
      }
      spotify_playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_public: boolean | null
          last_synced_at: string | null
          name: string
          owner_id: string | null
          snapshot_id: string | null
          spotify_playlist_id: string
          spotify_url: string | null
          track_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          last_synced_at?: string | null
          name: string
          owner_id?: string | null
          snapshot_id?: string | null
          spotify_playlist_id: string
          spotify_url?: string | null
          track_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          last_synced_at?: string | null
          name?: string
          owner_id?: string | null
          snapshot_id?: string | null
          spotify_playlist_id?: string
          spotify_url?: string | null
          track_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spotify_show_episodes: {
        Row: {
          audio_preview_url: string | null
          created_at: string
          description: string | null
          duration_ms: number | null
          id: string
          is_featured: boolean | null
          name: string
          release_date: string | null
          show_id: string
          spotify_episode_id: string
          spotify_url: string | null
          updated_at: string
        }
        Insert: {
          audio_preview_url?: string | null
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          id?: string
          is_featured?: boolean | null
          name: string
          release_date?: string | null
          show_id: string
          spotify_episode_id: string
          spotify_url?: string | null
          updated_at?: string
        }
        Update: {
          audio_preview_url?: string | null
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          id?: string
          is_featured?: boolean | null
          name?: string
          release_date?: string | null
          show_id?: string
          spotify_episode_id?: string
          spotify_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotify_show_episodes_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "spotify_curated_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      spotify_tracks: {
        Row: {
          added_at: string | null
          album: string | null
          artist: string
          audio_features: Json | null
          created_at: string
          duration_ms: number | null
          explicit: boolean | null
          genre: string | null
          id: string
          image_url: string | null
          playlist_id: string | null
          popularity: number | null
          preview_url: string | null
          spotify_track_id: string
          spotify_url: string | null
          title: string
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          added_at?: string | null
          album?: string | null
          artist: string
          audio_features?: Json | null
          created_at?: string
          duration_ms?: number | null
          explicit?: boolean | null
          genre?: string | null
          id?: string
          image_url?: string | null
          playlist_id?: string | null
          popularity?: number | null
          preview_url?: string | null
          spotify_track_id: string
          spotify_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          added_at?: string | null
          album?: string | null
          artist?: string
          audio_features?: Json | null
          created_at?: string
          duration_ms?: number | null
          explicit?: boolean | null
          genre?: string | null
          id?: string
          image_url?: string | null
          playlist_id?: string | null
          popularity?: number | null
          preview_url?: string | null
          spotify_track_id?: string
          spotify_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_spotify_tracks_playlist_id"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "spotify_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      spotify_user_stats: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string
          rank_position: number | null
          spotify_id: string
          stat_type: string
          time_range: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          name: string
          rank_position?: number | null
          spotify_id: string
          stat_type: string
          time_range: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          rank_position?: number | null
          spotify_id?: string
          stat_type?: string
          time_range?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spotlight_images: {
        Row: {
          context: string | null
          created_at: string | null
          discogs_release_id: number | null
          display_order: number | null
          id: string
          image_source: string
          image_url: string
          insertion_point: string | null
          is_inserted: boolean | null
          spotlight_id: string | null
          title: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          discogs_release_id?: number | null
          display_order?: number | null
          id?: string
          image_source: string
          image_url: string
          insertion_point?: string | null
          is_inserted?: boolean | null
          spotlight_id?: string | null
          title?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string | null
          discogs_release_id?: number | null
          display_order?: number | null
          id?: string
          image_source?: string
          image_url?: string
          insertion_point?: string | null
          is_inserted?: boolean | null
          spotlight_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spotlight_images_spotlight_id_fkey"
            columns: ["spotlight_id"]
            isOneToOne: false
            referencedRelation: "artist_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string
          data: Json | null
          event_type: string
          id: string
          processed: boolean | null
          stripe_event_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          event_type: string
          id?: string
          processed?: boolean | null
          stripe_event_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          event_type?: string
          id?: string
          processed?: boolean | null
          stripe_event_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          ai_chat_limit: number | null
          ai_scans_limit: number | null
          api_access: boolean | null
          billing_interval: string
          bulk_upload_limit: number | null
          created_at: string
          currency: string
          id: string
          is_active: boolean | null
          marketplace_access: boolean | null
          multi_user: boolean | null
          name: string
          price_amount: number
          priority_support: boolean | null
          slug: string
          sort_order: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
          white_label: boolean | null
        }
        Insert: {
          ai_chat_limit?: number | null
          ai_scans_limit?: number | null
          api_access?: boolean | null
          billing_interval?: string
          bulk_upload_limit?: number | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean | null
          marketplace_access?: boolean | null
          multi_user?: boolean | null
          name: string
          price_amount: number
          priority_support?: boolean | null
          slug: string
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
          white_label?: boolean | null
        }
        Update: {
          ai_chat_limit?: number | null
          ai_scans_limit?: number | null
          api_access?: boolean | null
          billing_interval?: string
          bulk_upload_limit?: number | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean | null
          marketplace_access?: boolean | null
          multi_user?: boolean | null
          name?: string
          price_amount?: number
          priority_support?: boolean | null
          slug?: string
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
          white_label?: boolean | null
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
      time_machine_events: {
        Row: {
          archive_photos: Json | null
          artist_name: string
          attendance_count: number | null
          audio_fragments: Json | null
          color_palette: Json | null
          concert_date: string
          created_at: string | null
          cultural_significance: string | null
          edition_size: number | null
          event_subtitle: string | null
          event_title: string
          fan_quotes: Json | null
          historical_context: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          metal_print_image_url: string | null
          original_poster_metadata: Json | null
          original_poster_url: string | null
          poster_image_url: string | null
          poster_source: string | null
          poster_style: string | null
          press_reviews: Json | null
          price_metal: number | null
          price_poster: number | null
          products_sold: number | null
          published_at: string | null
          qr_code_url: string | null
          setlist: Json | null
          slug: string
          story_content: string
          tags: string[] | null
          ticket_price_original: number | null
          tour_name: string | null
          typography_style: string | null
          updated_at: string | null
          venue_city: string
          venue_country: string | null
          venue_name: string
          views_count: number | null
        }
        Insert: {
          archive_photos?: Json | null
          artist_name: string
          attendance_count?: number | null
          audio_fragments?: Json | null
          color_palette?: Json | null
          concert_date: string
          created_at?: string | null
          cultural_significance?: string | null
          edition_size?: number | null
          event_subtitle?: string | null
          event_title: string
          fan_quotes?: Json | null
          historical_context?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          metal_print_image_url?: string | null
          original_poster_metadata?: Json | null
          original_poster_url?: string | null
          poster_image_url?: string | null
          poster_source?: string | null
          poster_style?: string | null
          press_reviews?: Json | null
          price_metal?: number | null
          price_poster?: number | null
          products_sold?: number | null
          published_at?: string | null
          qr_code_url?: string | null
          setlist?: Json | null
          slug: string
          story_content: string
          tags?: string[] | null
          ticket_price_original?: number | null
          tour_name?: string | null
          typography_style?: string | null
          updated_at?: string | null
          venue_city: string
          venue_country?: string | null
          venue_name: string
          views_count?: number | null
        }
        Update: {
          archive_photos?: Json | null
          artist_name?: string
          attendance_count?: number | null
          audio_fragments?: Json | null
          color_palette?: Json | null
          concert_date?: string
          created_at?: string | null
          cultural_significance?: string | null
          edition_size?: number | null
          event_subtitle?: string | null
          event_title?: string
          fan_quotes?: Json | null
          historical_context?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          metal_print_image_url?: string | null
          original_poster_metadata?: Json | null
          original_poster_url?: string | null
          poster_image_url?: string | null
          poster_source?: string | null
          poster_style?: string | null
          press_reviews?: Json | null
          price_metal?: number | null
          price_poster?: number | null
          products_sold?: number | null
          published_at?: string | null
          qr_code_url?: string | null
          setlist?: Json | null
          slug?: string
          story_content?: string
          tags?: string[] | null
          ticket_price_original?: number | null
          tour_name?: string | null
          typography_style?: string | null
          updated_at?: string | null
          venue_city?: string
          venue_country?: string | null
          venue_name?: string
          views_count?: number | null
        }
        Relationships: []
      }
      time_machine_fan_memories: {
        Row: {
          created_at: string | null
          discovery_story: string | null
          event_id: string | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          likes_count: number | null
          memory_text: string
          photo_url: string | null
          updated_at: string | null
          user_id: string | null
          was_present: boolean | null
        }
        Insert: {
          created_at?: string | null
          discovery_story?: string | null
          event_id?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          likes_count?: number | null
          memory_text: string
          photo_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          was_present?: boolean | null
        }
        Update: {
          created_at?: string | null
          discovery_story?: string | null
          event_id?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          likes_count?: number | null
          memory_text?: string
          photo_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          was_present?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "time_machine_fan_memories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "time_machine_events"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          ai_chat_used: number | null
          ai_scans_used: number | null
          bulk_uploads_used: number | null
          created_at: string
          id: string
          period_end: string
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_chat_used?: number | null
          ai_scans_used?: number | null
          bulk_uploads_used?: number | null
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_chat_used?: number | null
          ai_scans_used?: number | null
          bulk_uploads_used?: number | null
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
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
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
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
          order_id: string | null
          release_id: string | null
          shop_description: string | null
          sold_at: string | null
          sold_to: string | null
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
          order_id?: string | null
          release_id?: string | null
          shop_description?: string | null
          sold_at?: string | null
          sold_to?: string | null
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
          order_id?: string | null
          release_id?: string | null
          shop_description?: string | null
          sold_at?: string | null
          sold_to?: string | null
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
      youtube_discoveries: {
        Row: {
          artist_name: string | null
          channel_id: string | null
          channel_name: string | null
          content_type: string
          created_at: string | null
          description: string | null
          discovered_at: string | null
          duration: string | null
          duration_minutes: number | null
          featured_at: string | null
          id: string
          is_featured: boolean | null
          published_at: string | null
          quality_score: number | null
          source_channel: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          video_id: string
          view_count: number | null
        }
        Insert: {
          artist_name?: string | null
          channel_id?: string | null
          channel_name?: string | null
          content_type: string
          created_at?: string | null
          description?: string | null
          discovered_at?: string | null
          duration?: string | null
          duration_minutes?: number | null
          featured_at?: string | null
          id?: string
          is_featured?: boolean | null
          published_at?: string | null
          quality_score?: number | null
          source_channel?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          video_id: string
          view_count?: number | null
        }
        Update: {
          artist_name?: string | null
          channel_id?: string | null
          channel_name?: string | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          discovered_at?: string | null
          duration?: string | null
          duration_minutes?: number | null
          featured_at?: string | null
          id?: string
          is_featured?: boolean | null
          published_at?: string | null
          quality_score?: number | null
          source_channel?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          video_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      cronjob_stats: {
        Row: {
          avg_execution_time_ms: number | null
          failed_runs: number | null
          function_name: string | null
          last_run_at: string | null
          last_status: string | null
          running_count: number | null
          successful_runs: number | null
          total_runs: number | null
        }
        Relationships: []
      }
      featured_photos: {
        Row: {
          album: string | null
          artist: string | null
          canonical_url: string | null
          caption: string | null
          city: string | null
          comment_count: number | null
          country: string | null
          created_at: string | null
          display_url: string | null
          event_date: string | null
          flagged_count: number | null
          format: string | null
          height: number | null
          id: string | null
          license_granted: boolean | null
          like_count: number | null
          original_url: string | null
          print_allowed: boolean | null
          published_at: string | null
          recent_views: number | null
          seo_description: string | null
          seo_slug: string | null
          seo_title: string | null
          source_type: string | null
          status: string | null
          tags: string[] | null
          user_id: string | null
          venue: string | null
          view_count: number | null
          width: number | null
          year: number | null
        }
        Relationships: []
      }
      notification_stats: {
        Row: {
          last_updated: string | null
          read_count: number | null
          this_week_count: number | null
          today_count: number | null
          total_count: number | null
          type: string | null
          unread_count: number | null
        }
        Relationships: []
      }
      unified_scans: {
        Row: {
          ai_description: string | null
          artist: string | null
          artwork_url: string | null
          barcode: string | null
          calculated_advice_price: number | null
          catalog_number: string | null
          comments: string | null
          condition_grade: string | null
          confidence_score: number | null
          country: string | null
          created_at: string | null
          discogs_id: number | null
          discogs_url: string | null
          error_message: string | null
          format: string | null
          genre: string | null
          highest_price: number | null
          id: string | null
          is_flagged_incorrect: boolean | null
          is_for_sale: boolean | null
          is_public: boolean | null
          label: string | null
          lowest_price: number | null
          matrix_number: string | null
          media_type: string | null
          median_price: number | null
          photo_urls: string[] | null
          release_id: string | null
          search_queries: string[] | null
          source_table: string | null
          status: string | null
          style: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_usage_limit: {
        Args: { p_usage_type: string; p_user_id: string }
        Returns: {
          can_use: boolean
          current_usage: number
          limit_amount: number
          plan_name: string
        }[]
      }
      cleanup_duplicate_cd_scans: { Args: never; Returns: number }
      cleanup_duplicate_vinyl_scans: { Args: never; Returns: number }
      cleanup_stuck_batch_processes: { Args: never; Returns: undefined }
      decrement_product_stock: {
        Args: { p_product_id: string; p_quantity?: number }
        Returns: boolean
      }
      extract_and_update_discogs_ids: { Args: never; Returns: number }
      extract_discogs_id_from_url: {
        Args: { url_text: string }
        Returns: number
      }
      find_or_create_artist_fanwall: {
        Args: { artist_name_input: string }
        Returns: string
      }
      find_or_create_release: {
        Args: {
          p_artist: string
          p_artwork_url?: string
          p_catalog_number?: string
          p_country?: string
          p_discogs_id: number
          p_discogs_url?: string
          p_format?: string
          p_genre?: string
          p_label?: string
          p_master_id?: number
          p_style?: string[]
          p_title: string
          p_year?: number
        }
        Returns: string
      }
      generate_artist_slug: {
        Args: { artist_name_input: string }
        Returns: string
      }
      generate_order_number: { Args: never; Returns: string }
      generate_product_slug: {
        Args: { p_artist: string; p_title: string }
        Returns: string
      }
      generate_shop_slug: { Args: { shop_name: string }; Returns: string }
      get_current_usage: {
        Args: { p_user_id: string }
        Returns: {
          ai_chat_used: number
          ai_scans_used: number
          bulk_uploads_used: number
          period_end: string
          period_start: string
        }[]
      }
      get_price_trend: {
        Args: { p_discogs_id: number }
        Returns: {
          avg_price: number
          max_price: number
          min_price: number
          price_changes: number
          trend_direction: string
        }[]
      }
      get_public_user_stats: {
        Args: never
        Returns: {
          new_users_last_30_days: number
          new_users_last_7_days: number
          total_users: number
        }[]
      }
      get_random_bot_user: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_product_view: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      increment_shop_view_count: {
        Args: { shop_slug: string }
        Returns: undefined
      }
      increment_topic_views: { Args: { topic_id: string }; Returns: undefined }
      increment_usage: {
        Args: { p_increment?: number; p_usage_type: string; p_user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      log_cronjob_complete: {
        Args: {
          p_error_message?: string
          p_items_processed?: number
          p_log_id: string
          p_metadata?: Json
          p_status: string
        }
        Returns: undefined
      }
      log_cronjob_start: {
        Args: { p_function_name: string; p_metadata?: Json }
        Returns: string
      }
      process_indexnow_queue: {
        Args: never
        Returns: {
          processed_count: number
        }[]
      }
      refresh_featured_photos: { Args: never; Returns: undefined }
      refresh_notification_stats: { Args: never; Returns: undefined }
      search_platform_products: {
        Args: {
          p_category?: string
          p_limit?: number
          p_max_price?: number
          p_media_type?: string
          p_min_price?: number
          p_offset?: number
          search_query: string
        }
        Returns: {
          artist: string
          id: string
          price: number
          primary_image: string
          rank: number
          slug: string
          title: string
        }[]
      }
      submit_to_indexnow: {
        Args: { p_content_type?: string; p_url: string }
        Returns: undefined
      }
      update_cd_discogs_ids: { Args: never; Returns: number }
      update_release_aggregated_data: {
        Args: { release_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
