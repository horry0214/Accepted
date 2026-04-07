export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          parent_comment_id: string | null;
          thread_id: string;
          updated_at: string;
          upvotes: number;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          parent_comment_id?: string | null;
          thread_id: string;
          updated_at?: string;
          upvotes?: number;
          user_id?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          parent_comment_id?: string | null;
          thread_id?: string;
          updated_at?: string;
          upvotes?: number;
          user_id?: string;
        };
      };
      conferences: {
        Row: {
          acceptance_rate: string | null;
          annual: string | null;
          category_description: string | null;
          category_name: string;
          ccf_rank: string;
          core_rank: string | null;
          conference_date: string | null;
          conference_location: string | null;
          created_at: string;
          deadline: string | null;
          deadline_note: string | null;
          deadline_extension_probability: number | null;
          deadline_type: string;
          deadline_timezone: string | null;
          description: string | null;
          full_name: string;
          id: string;
          last_deadline: string | null;
          last_deadline_note: string | null;
          metadata: Json | null;
          name: string;
          next_deadline: string | null;
          next_deadline_note: string | null;
          page_limit: string | null;
          slug: string;
          source_last_modified: string | null;
          subcategories: string[] | null;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          acceptance_rate?: string | null;
          annual?: string | null;
          category_description?: string | null;
          category_name: string;
          ccf_rank: string;
          core_rank?: string | null;
          conference_date?: string | null;
          conference_location?: string | null;
          created_at?: string;
          deadline?: string | null;
          deadline_note?: string | null;
          deadline_extension_probability?: number | null;
          deadline_type?: string;
          deadline_timezone?: string | null;
          description?: string | null;
          full_name: string;
          id?: string;
          last_deadline?: string | null;
          last_deadline_note?: string | null;
          metadata?: Json | null;
          name: string;
          next_deadline?: string | null;
          next_deadline_note?: string | null;
          page_limit?: string | null;
          slug: string;
          source_last_modified?: string | null;
          subcategories?: string[] | null;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          acceptance_rate?: string | null;
          annual?: string | null;
          category_description?: string | null;
          category_name?: string;
          ccf_rank?: string;
          core_rank?: string | null;
          conference_date?: string | null;
          conference_location?: string | null;
          created_at?: string;
          deadline?: string | null;
          deadline_note?: string | null;
          deadline_extension_probability?: number | null;
          deadline_type?: string;
          deadline_timezone?: string | null;
          description?: string | null;
          full_name?: string;
          id?: string;
          last_deadline?: string | null;
          last_deadline_note?: string | null;
          metadata?: Json | null;
          name?: string;
          next_deadline?: string | null;
          next_deadline_note?: string | null;
          page_limit?: string | null;
          slug?: string;
          source_last_modified?: string | null;
          subcategories?: string[] | null;
          updated_at?: string;
          website?: string | null;
        };
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
          username?: string | null;
        };
      };
      threads: {
        Row: {
          conference_id: string;
          content: string;
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          upvotes: number;
          user_id: string;
        };
        Insert: {
          conference_id: string;
          content: string;
          created_at?: string;
          id?: string;
          title: string;
          updated_at?: string;
          upvotes?: number;
          user_id?: string;
        };
        Update: {
          conference_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          upvotes?: number;
          user_id?: string;
        };
      };
      votes: {
        Row: {
          created_at: string;
          id: string;
          target_id: string;
          target_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          target_id: string;
          target_type: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          target_id?: string;
          target_type?: string;
          user_id?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
