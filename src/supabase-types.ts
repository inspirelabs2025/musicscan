export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          project_id: string;
          role: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          project_id: string;
          role?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          project_id?: string;
          role?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          project_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          project_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          project_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_satisfaction: {
        Row: {
          created_at: string;
          data: Json | null;
          id: string;
          project_id: string | null;
          rating: number;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          project_id?: string | null;
          rating: number;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          project_id?: string | null;
          rating?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customer_satisfaction_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_satisfaction_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      feed_downloads: {
        Row: {
          created_at: string;
          feed_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          feed_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          feed_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feed_downloads_feed_id_fkey";
            columns: ["feed_id"];
            isOneToOne: false;
            referencedRelation: "feeds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feed_downloads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      feeds: {
        Row: {
          created_at: string;
          data: Json;
          description: string | null;
          id: string;
          image_url: string | null;
          last_crawled_at: string | null;
          link: string | null;
          project_id: string;
          status: Database["public"]["Enums"]["FeedStatus"]
          source: string;
          title: string;
          url: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          data?: Json;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          last_crawled_at?: string | null;
          link?: string | null;
          project_id: string;
          status?: Database["public"]["Enums"]["FeedStatus"]
          source: string;
          title: string;
          url: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          last_crawled_at?: string | null;
          link?: string | null;
          project_id?: string;
          status?: Database["public"]["Enums"]["FeedStatus"]
          source?: string;
          title?: string;
          url?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feeds_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feeds_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      project_members: {
        Row: {
          created_at: string;
          id: string;
          project_id: string;
          role: Database["public"]["Enums"]["MembershipRole"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          project_id: string;
          role: Database["public"]["Enums"]["MembershipRole"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          project_id?: string;
          role?: Database["public"]["Enums"]["MembershipRole"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
          owner_id: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          owner_id: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      scans: {
        Row: {
          created_at: string;
          id: string;
          image_url: string;
          metadata: Json | null;
          project_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url: string;
          metadata?: Json | null;
          project_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string;
          metadata?: Json | null;
          project_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scans_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          billing_address: Json | null;
          full_name: string | null;
          id: string;
          payment_method: Json | null;
        };
        Insert: {
          avatar_url?: string | null;
          billing_address?: Json | null;
          full_name?: string | null;
          id: string;
          payment_method?: Json | null;
        };
        Update: {
          avatar_url?: string | null;
          billing_address?: Json | null;
          full_name?: string | null;
          id?: string;
          payment_method?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      FeedStatus: "active" | "inactive" | "error";
      MembershipRole: "owner" | "admin" | "member";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Row"];

export type Enums<EnumName extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][EnumName];