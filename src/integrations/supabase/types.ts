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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at_utc: string
          created_by: string
          end_at_utc: string
          granularity: string
          id: string
          name: string
          start_at_utc: string
          status: string
          updated_at_utc: string
        }
        Insert: {
          created_at_utc?: string
          created_by: string
          end_at_utc: string
          granularity: string
          id?: string
          name: string
          start_at_utc: string
          status?: string
          updated_at_utc?: string
        }
        Update: {
          created_at_utc?: string
          created_by?: string
          end_at_utc?: string
          granularity?: string
          id?: string
          name?: string
          start_at_utc?: string
          status?: string
          updated_at_utc?: string
        }
        Relationships: []
      }
      admin_access_pins: {
        Row: {
          created_at: string
          expires_at: string
          generated_by: string
          id: string
          is_used: boolean
          pin_code: string
          target_user_id: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          generated_by: string
          id?: string
          is_used?: boolean
          pin_code: string
          target_user_id: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          generated_by?: string
          id?: string
          is_used?: boolean
          pin_code?: string
          target_user_id?: string
          updated_at?: string
          used_at?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string
          created_at_utc: string
          entity: string
          entity_id: string | null
          id: string
          payload_json: Json | null
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at_utc?: string
          entity: string
          entity_id?: string | null
          id?: string
          payload_json?: Json | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at_utc?: string
          entity?: string
          entity_id?: string | null
          id?: string
          payload_json?: Json | null
        }
        Relationships: []
      }
      auth_rate_limit: {
        Row: {
          attempt_type: string
          attempts_count: number
          blocked_until: string | null
          created_at: string
          first_attempt_at: string
          id: string
          identifier: string
          last_attempt_at: string
        }
        Insert: {
          attempt_type: string
          attempts_count?: number
          blocked_until?: string | null
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier: string
          last_attempt_at?: string
        }
        Update: {
          attempt_type?: string
          attempts_count?: number
          blocked_until?: string | null
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier?: string
          last_attempt_at?: string
        }
        Relationships: []
      }
      avatar_images: {
        Row: {
          category: string
          created_at: string | null
          display_name: string
          file_path: string
          filename: string
          id: string
          is_active: boolean | null
          order_index: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          display_name: string
          file_path: string
          filename: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          display_name?: string
          file_path?: string
          filename?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          school_id: string | null
          time: string | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          school_id?: string | null
          time?: string | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          school_id?: string | null
          time?: string | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_settings: {
        Row: {
          auto_show_before_days: number | null
          created_at: string
          header_color: string | null
          header_duration: number | null
          id: string
          is_active: boolean | null
          show_in_header: boolean | null
          updated_at: string
        }
        Insert: {
          auto_show_before_days?: number | null
          created_at?: string
          header_color?: string | null
          header_duration?: number | null
          id?: string
          is_active?: boolean | null
          show_in_header?: boolean | null
          updated_at?: string
        }
        Update: {
          auto_show_before_days?: number | null
          created_at?: string
          header_color?: string | null
          header_duration?: number | null
          id?: string
          is_active?: boolean | null
          show_in_header?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      class_names: {
        Row: {
          created_at_utc: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at_utc?: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at_utc?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_names_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      class_students: {
        Row: {
          class_id: string
          created_at_utc: string
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at_utc?: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at_utc?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year_id: string
          class_name_id: string
          created_at_utc: string
          created_by: string
          grade_level_id: string
          id: string
          school_id: string
          status: string
          updated_at_utc: string
        }
        Insert: {
          academic_year_id: string
          class_name_id: string
          created_at_utc?: string
          created_by: string
          grade_level_id: string
          id?: string
          school_id: string
          status?: string
          updated_at_utc?: string
        }
        Update: {
          academic_year_id?: string
          class_name_id?: string
          created_at_utc?: string
          created_by?: string
          grade_level_id?: string
          id?: string
          school_id?: string
          status?: string
          updated_at_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_class_name_id_fkey"
            columns: ["class_name_id"]
            isOneToOne: false
            referencedRelation: "class_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "teacher_assigned_grades"
            referencedColumns: ["grade_level_id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          grade_level: string | null
          id: string
          school_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          grade_level?: string | null
          id?: string
          school_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          grade_level?: string | null
          id?: string
          school_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      document_activities: {
        Row: {
          action_details: Json | null
          activity_type: string
          created_at: string
          document_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          activity_type: string
          created_at?: string
          document_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_details?: Json | null
          activity_type?: string
          created_at?: string
          document_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      document_comments: {
        Row: {
          author_id: string
          comment_type: string
          content: string
          created_at: string
          document_id: string
          id: string
          parent_comment_id: string | null
          position_end: number | null
          position_start: number | null
          resolved_at: string | null
          resolved_by: string | null
          selected_text: string | null
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          comment_type?: string
          content: string
          created_at?: string
          document_id: string
          id?: string
          parent_comment_id?: string | null
          position_end?: number | null
          position_start?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          selected_text?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          comment_type?: string
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          parent_comment_id?: string | null
          position_end?: number | null
          position_start?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          selected_text?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "document_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      document_permissions: {
        Row: {
          document_id: string
          expires_at: string | null
          granted_at: string
          granted_by: string
          id: string
          is_active: boolean | null
          permission_type: string
          user_id: string
        }
        Insert: {
          document_id: string
          expires_at?: string | null
          granted_at?: string
          granted_by: string
          id?: string
          is_active?: boolean | null
          permission_type: string
          user_id: string
        }
        Update: {
          document_id?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string
          id?: string
          is_active?: boolean | null
          permission_type?: string
          user_id?: string
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          change_summary: string | null
          content: Json
          created_at: string
          created_by: string
          document_id: string
          html_content: string | null
          id: string
          metadata: Json | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          content: Json
          created_at?: string
          created_by: string
          document_id: string
          html_content?: string | null
          id?: string
          metadata?: Json | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          content?: Json
          created_at?: string
          created_by?: string
          document_id?: string
          html_content?: string | null
          id?: string
          metadata?: Json | null
          version_number?: number
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at_utc: string
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          resend_id: string | null
          school_id: string
          sent_at: string | null
          status: string
          student_id: string
          updated_at_utc: string
        }
        Insert: {
          created_at_utc?: string
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          resend_id?: string | null
          school_id: string
          sent_at?: string | null
          status?: string
          student_id: string
          updated_at_utc?: string
        }
        Update: {
          created_at_utc?: string
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          resend_id?: string | null
          school_id?: string
          sent_at?: string | null
          status?: string
          student_id?: string
          updated_at_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string | null
          id: string
          role_in_course: string
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string | null
          id?: string
          role_in_course: string
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string | null
          id?: string
          role_in_course?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempt_questions: {
        Row: {
          answered_at: string | null
          attempt_id: string
          display_order: number
          id: string
          question_id: string
          score: number | null
          student_answer: string | null
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          display_order: number
          id?: string
          question_id: string
          score?: number | null
          student_answer?: string | null
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          display_order?: number
          id?: string
          question_id?: string
          score?: number | null
          student_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempt_questions_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempt_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          exam_id: string
          finished_at: string | null
          id: string
          max_score: number
          started_at: string | null
          status: string | null
          student_id: string
          total_score: number | null
        }
        Insert: {
          exam_id: string
          finished_at?: string | null
          id?: string
          max_score: number
          started_at?: string | null
          status?: string | null
          student_id: string
          total_score?: number | null
        }
        Update: {
          exam_id?: string
          finished_at?: string | null
          id?: string
          max_score?: number
          started_at?: string | null
          status?: string | null
          student_id?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          bank_category: string | null
          category_id: string | null
          choices: Json | null
          correct_answer: string | null
          created_at: string | null
          difficulty_level:
            | Database["public"]["Enums"]["question_difficulty"]
            | null
          exam_id: string
          explanation: string | null
          id: string
          lesson_id: string | null
          points: number | null
          question_bank_id: string | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          section_id: string | null
          tags: string[] | null
          topic_id: string | null
        }
        Insert: {
          bank_category?: string | null
          category_id?: string | null
          choices?: Json | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty_level?:
            | Database["public"]["Enums"]["question_difficulty"]
            | null
          exam_id: string
          explanation?: string | null
          id?: string
          lesson_id?: string | null
          points?: number | null
          question_bank_id?: string | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          section_id?: string | null
          tags?: string[] | null
          topic_id?: string | null
        }
        Update: {
          bank_category?: string | null
          category_id?: string | null
          choices?: Json | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty_level?:
            | Database["public"]["Enums"]["question_difficulty"]
            | null
          exam_id?: string
          explanation?: string | null
          id?: string
          lesson_id?: string | null
          points?: number | null
          question_bank_id?: string | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          section_id?: string | null
          tags?: string[] | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "grade11_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_question_bank_id_fkey"
            columns: ["question_bank_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "grade11_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "grade11_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_template_questions: {
        Row: {
          created_at: string
          id: string
          order_index: number
          points_override: number | null
          question_id: string | null
          template_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          points_override?: number | null
          question_id?: string | null
          template_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          points_override?: number | null
          question_id?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_template_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_template_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "exam_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          difficulty_distribution: Json | null
          duration_minutes: number | null
          grade_level: string
          id: string
          is_active: boolean | null
          max_attempts: number | null
          pass_percentage: number | null
          question_sources: Json | null
          randomize_answers: boolean | null
          randomize_questions: boolean | null
          school_id: string | null
          show_results_immediately: boolean | null
          title: string
          total_questions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          difficulty_distribution?: Json | null
          duration_minutes?: number | null
          grade_level?: string
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          pass_percentage?: number | null
          question_sources?: Json | null
          randomize_answers?: boolean | null
          randomize_questions?: boolean | null
          school_id?: string | null
          show_results_immediately?: boolean | null
          title: string
          total_questions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          difficulty_distribution?: Json | null
          duration_minutes?: number | null
          grade_level?: string
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          pass_percentage?: number | null
          question_sources?: Json | null
          randomize_answers?: boolean | null
          randomize_questions?: boolean | null
          school_id?: string | null
          show_results_immediately?: boolean | null
          title?: string
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          course_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          grade_level: string | null
          id: string
          is_active: boolean | null
          max_attempts: number | null
          max_score: number | null
          pass_percentage: number | null
          randomized: boolean | null
          show_results_immediately: boolean | null
          starts_at: string | null
          template_id: string | null
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          max_score?: number | null
          pass_percentage?: number | null
          randomized?: boolean | null
          show_results_immediately?: boolean | null
          starts_at?: string | null
          template_id?: string | null
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          max_score?: number | null
          pass_percentage?: number | null
          randomized?: boolean | null
          show_results_immediately?: boolean | null
          starts_at?: string | null
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "exam_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_attempts: {
        Row: {
          answers: Json | null
          exercise_id: string
          finished_at: string | null
          id: string
          max_score: number
          score: number | null
          started_at: string | null
          student_id: string
        }
        Insert: {
          answers?: Json | null
          exercise_id: string
          finished_at?: string | null
          id?: string
          max_score: number
          score?: number | null
          started_at?: string | null
          student_id: string
        }
        Update: {
          answers?: Json | null
          exercise_id?: string
          finished_at?: string | null
          id?: string
          max_score?: number
          score?: number | null
          started_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          lesson_id: string
          max_score: number | null
          time_limit_minutes: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          lesson_id: string
          max_score?: number | null
          time_limit_minutes?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          lesson_id?: string
          max_score?: number | null
          time_limit_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_public: boolean | null
          kind: Database["public"]["Enums"]["file_kind"]
          lesson_id: string | null
          metadata: Json | null
          owner_user_id: string
          project_id: string | null
          school_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          kind: Database["public"]["Enums"]["file_kind"]
          lesson_id?: string | null
          metadata?: Json | null
          owner_user_id: string
          project_id?: string | null
          school_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          kind?: Database["public"]["Enums"]["file_kind"]
          lesson_id?: string | null
          metadata?: Json | null
          owner_user_id?: string
          project_id?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      game_audio_files: {
        Row: {
          audio_type: string
          created_at: string
          created_by: string | null
          file_name: string
          file_path: string
          file_size: number | null
          game_id: string
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          audio_type: string
          created_at?: string
          created_by?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          game_id: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          audio_type?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          game_id?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_audio_files_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "pair_matching_games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string | null
          description: string | null
          grade_level: string
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          grade_level?: string
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          grade_level?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      grade_levels: {
        Row: {
          code: string
          created_at_utc: string
          id: string
          label: string
        }
        Insert: {
          code: string
          created_at_utc?: string
          id?: string
          label: string
        }
        Update: {
          code?: string
          created_at_utc?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
      grade10_documents: {
        Row: {
          allowed_roles: string[] | null
          category: string | null
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          grade_level: string | null
          id: string
          is_active: boolean | null
          is_visible: boolean | null
          order_index: number | null
          owner_user_id: string
          published_at: string | null
          school_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          allowed_roles?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          owner_user_id: string
          published_at?: string | null
          school_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          allowed_roles?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          owner_user_id?: string
          published_at?: string | null
          school_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      grade10_mini_projects: {
        Row: {
          completed_at: string | null
          content: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          progress_percentage: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          school_id: string | null
          status: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          progress_percentage?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id?: string | null
          status?: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          progress_percentage?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id?: string | null
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      grade10_project_comments: {
        Row: {
          comment_text: string
          comment_type: string | null
          created_at: string
          id: string
          is_private: boolean | null
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          comment_type?: string | null
          created_at?: string
          id?: string
          is_private?: boolean | null
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          comment_type?: string | null
          created_at?: string
          id?: string
          is_private?: boolean | null
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade10_project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "grade10_mini_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      grade10_project_files: {
        Row: {
          alt_text: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          is_image: boolean | null
          project_id: string
          uploaded_by: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          is_image?: boolean | null
          project_id: string
          uploaded_by: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          is_image?: boolean | null
          project_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade10_project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "grade10_mini_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      grade10_project_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_completed: boolean | null
          order_index: number | null
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade10_project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "grade10_mini_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      grade10_videos: {
        Row: {
          allowed_roles: string[] | null
          category: string | null
          created_at: string
          description: string | null
          duration: string | null
          grade_level: string | null
          id: string
          is_active: boolean | null
          is_visible: boolean | null
          order_index: number | null
          owner_user_id: string
          published_at: string | null
          school_id: string | null
          source_type: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          allowed_roles?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          owner_user_id: string
          published_at?: string | null
          school_id?: string | null
          source_type?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          allowed_roles?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          owner_user_id?: string
          published_at?: string | null
          school_id?: string | null
          source_type?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      grade11_content_concepts: {
        Row: {
          concept_text: string
          concept_type: string
          created_at: string | null
          id: string
          importance_level: number
          lesson_id: string
        }
        Insert: {
          concept_text: string
          concept_type: string
          created_at?: string | null
          id?: string
          importance_level?: number
          lesson_id: string
        }
        Update: {
          concept_text?: string
          concept_type?: string
          created_at?: string | null
          id?: string
          importance_level?: number
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade11_content_concepts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "grade11_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_content_games: {
        Row: {
          auto_generate_pairs: boolean | null
          created_at: string
          created_by: string | null
          game_id: string | null
          id: string
          is_active: boolean | null
          lesson_id: string | null
          section_id: string | null
          term_selection_criteria: Json | null
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          auto_generate_pairs?: boolean | null
          created_at?: string
          created_by?: string | null
          game_id?: string | null
          id?: string
          is_active?: boolean | null
          lesson_id?: string | null
          section_id?: string | null
          term_selection_criteria?: Json | null
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_generate_pairs?: boolean | null
          created_at?: string
          created_by?: string | null
          game_id?: string | null
          id?: string
          is_active?: boolean | null
          lesson_id?: string | null
          section_id?: string | null
          term_selection_criteria?: Json | null
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade11_content_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "pair_matching_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade11_content_games_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "grade11_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade11_content_games_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "grade11_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade11_content_games_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "grade11_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_documents: {
        Row: {
          allowed_roles: string[] | null
          category: string
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          grade_level: string
          id: string
          is_active: boolean | null
          is_visible: boolean | null
          order_index: number | null
          owner_user_id: string
          published_at: string | null
          school_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          allowed_roles?: string[] | null
          category: string
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          grade_level?: string
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          owner_user_id: string
          published_at?: string | null
          school_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          allowed_roles?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          grade_level?: string
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          owner_user_id?: string
          published_at?: string | null
          school_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      grade11_educational_terms: {
        Row: {
          approved_by: string | null
          created_at: string
          created_by: string | null
          definition: string
          difficulty_level: string
          extracted_from_content: boolean | null
          id: string
          importance_level: number
          is_approved: boolean | null
          lesson_id: string | null
          section_id: string | null
          term_text: string
          term_type: string
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          definition: string
          difficulty_level?: string
          extracted_from_content?: boolean | null
          id?: string
          importance_level?: number
          is_approved?: boolean | null
          lesson_id?: string | null
          section_id?: string | null
          term_text: string
          term_type?: string
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          definition?: string
          difficulty_level?: string
          extracted_from_content?: boolean | null
          id?: string
          importance_level?: number
          is_approved?: boolean | null
          lesson_id?: string | null
          section_id?: string | null
          term_text?: string
          term_type?: string
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade11_educational_terms_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "grade11_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade11_educational_terms_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "grade11_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade11_educational_terms_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "grade11_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_game_achievements: {
        Row: {
          achievement_data: Json
          achievement_type: string
          created_at: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_data?: Json
          achievement_type: string
          created_at?: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_data?: Json
          achievement_type?: string
          created_at?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      grade11_game_progress: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          max_score: number
          score: number
          unlocked: boolean
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          max_score?: number
          score?: number
          unlocked?: boolean
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          max_score?: number
          score?: number
          unlocked?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade11_game_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "grade11_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_game_questions: {
        Row: {
          choices: Json
          correct_answer: string
          created_at: string
          created_by: string | null
          difficulty_level: string
          explanation: string | null
          id: string
          lesson_id: string | null
          points: number
          question_text: string
          question_type: string
          section_id: string | null
          topic_id: string | null
        }
        Insert: {
          choices?: Json
          correct_answer: string
          created_at?: string
          created_by?: string | null
          difficulty_level?: string
          explanation?: string | null
          id?: string
          lesson_id?: string | null
          points?: number
          question_text: string
          question_type?: string
          section_id?: string | null
          topic_id?: string | null
        }
        Update: {
          choices?: Json
          correct_answer?: string
          created_at?: string
          created_by?: string | null
          difficulty_level?: string
          explanation?: string | null
          id?: string
          lesson_id?: string | null
          points?: number
          question_text?: string
          question_type?: string
          section_id?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade11_game_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "grade11_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade11_game_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "grade11_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade11_game_questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "grade11_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_game_sessions: {
        Row: {
          completed: boolean | null
          created_at: string | null
          ended_at: string | null
          game_id: string | null
          id: string
          lesson_id: string | null
          max_score: number | null
          score: number | null
          session_data: Json | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          ended_at?: string | null
          game_id?: string | null
          id?: string
          lesson_id?: string | null
          max_score?: number | null
          score?: number | null
          session_data?: Json | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          ended_at?: string | null
          game_id?: string | null
          id?: string
          lesson_id?: string | null
          max_score?: number | null
          score?: number | null
          session_data?: Json | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade11_game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade11_game_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "grade11_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_generated_questions: {
        Row: {
          choices: Json | null
          concept_id: string | null
          correct_answer: string
          created_at: string | null
          difficulty_level: string
          explanation: string | null
          id: string
          is_approved: boolean | null
          lesson_id: string
          points: number
          question_text: string
          question_type: string
          success_rate: number | null
          template_id: string | null
          time_limit: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          choices?: Json | null
          concept_id?: string | null
          correct_answer: string
          created_at?: string | null
          difficulty_level: string
          explanation?: string | null
          id?: string
          is_approved?: boolean | null
          lesson_id: string
          points?: number
          question_text: string
          question_type: string
          success_rate?: number | null
          template_id?: string | null
          time_limit?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          choices?: Json | null
          concept_id?: string | null
          correct_answer?: string
          created_at?: string | null
          difficulty_level?: string
          explanation?: string | null
          id?: string
          is_approved?: boolean | null
          lesson_id?: string
          points?: number
          question_text?: string
          question_type?: string
          success_rate?: number | null
          template_id?: string | null
          time_limit?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grade11_generated_questions_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "grade11_content_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade11_generated_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "grade11_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade11_generated_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "grade11_question_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_lesson_completion_caps: {
        Row: {
          completion_count: number
          created_at: string
          first_completion_at: string | null
          id: string
          last_reward_at: string | null
          lesson_id: string
          max_coins_allowed: number
          max_xp_allowed: number
          total_coins_earned: number
          total_xp_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_count?: number
          created_at?: string
          first_completion_at?: string | null
          id?: string
          last_reward_at?: string | null
          lesson_id: string
          max_coins_allowed?: number
          max_xp_allowed?: number
          total_coins_earned?: number
          total_xp_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_count?: number
          created_at?: string
          first_completion_at?: string | null
          id?: string
          last_reward_at?: string | null
          lesson_id?: string
          max_coins_allowed?: number
          max_xp_allowed?: number
          total_coins_earned?: number
          total_xp_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      grade11_lesson_difficulty_config: {
        Row: {
          created_at: string | null
          easy_percentage: number
          hard_percentage: number
          id: string
          lesson_id: string
          lesson_level: string
          medium_percentage: number
          min_score_to_pass: number
          questions_per_session: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          easy_percentage?: number
          hard_percentage?: number
          id?: string
          lesson_id: string
          lesson_level: string
          medium_percentage?: number
          min_score_to_pass?: number
          questions_per_session?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          easy_percentage?: number
          hard_percentage?: number
          id?: string
          lesson_id?: string
          lesson_level?: string
          medium_percentage?: number
          min_score_to_pass?: number
          questions_per_session?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade11_lesson_difficulty_config_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "grade11_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_lesson_media: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          lesson_id: string
          media_type: Database["public"]["Enums"]["media_type"]
          metadata: Json | null
          order_index: number
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          lesson_id: string
          media_type: Database["public"]["Enums"]["media_type"]
          metadata?: Json | null
          order_index?: number
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          lesson_id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          metadata?: Json | null
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "grade11_lesson_media_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "grade11_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_lesson_rewards: {
        Row: {
          coins_earned: number
          completion_time: number | null
          created_at: string
          id: string
          lesson_id: string
          max_score: number
          mistakes_count: number | null
          previous_best_score: number | null
          reward_date: string
          reward_type: string
          score: number
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          coins_earned?: number
          completion_time?: number | null
          created_at?: string
          id?: string
          lesson_id: string
          max_score: number
          mistakes_count?: number | null
          previous_best_score?: number | null
          reward_date?: string
          reward_type: string
          score: number
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          coins_earned?: number
          completion_time?: number | null
          created_at?: string
          id?: string
          lesson_id?: string
          max_score?: number
          mistakes_count?: number | null
          previous_best_score?: number | null
          reward_date?: string
          reward_type?: string
          score?: number
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      grade11_lessons: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_active: boolean | null
          order_index: number
          title: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_index?: number
          title: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_index?: number
          title?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade11_lessons_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "grade11_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_player_analytics: {
        Row: {
          created_at: string | null
          id: string
          learning_pattern: Json | null
          lesson_id: string
          optimal_session_length: number | null
          preferred_question_types: Json | null
          recommendation_data: Json | null
          session_data: Json
          strong_areas: Json | null
          updated_at: string | null
          user_id: string
          weak_areas: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          learning_pattern?: Json | null
          lesson_id: string
          optimal_session_length?: number | null
          preferred_question_types?: Json | null
          recommendation_data?: Json | null
          session_data?: Json
          strong_areas?: Json | null
          updated_at?: string | null
          user_id: string
          weak_areas?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          learning_pattern?: Json | null
          lesson_id?: string
          optimal_session_length?: number | null
          preferred_question_types?: Json | null
          recommendation_data?: Json | null
          session_data?: Json
          strong_areas?: Json | null
          updated_at?: string | null
          user_id?: string
          weak_areas?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "grade11_player_analytics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "grade11_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_player_profiles: {
        Row: {
          avatar_id: string | null
          coins: number | null
          created_at: string | null
          game_id: string | null
          id: string
          last_played: string | null
          level: number | null
          player_name: string
          streak_days: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_id?: string | null
          coins?: number | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          last_played?: string | null
          level?: number | null
          player_name: string
          streak_days?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_id?: string | null
          coins?: number | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          last_played?: string | null
          level?: number | null
          player_name?: string
          streak_days?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade11_player_profiles_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_question_templates: {
        Row: {
          created_at: string | null
          difficulty_level: string
          id: string
          question_type: string
          subject_category: string
          template_name: string
          template_pattern: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty_level: string
          id?: string
          question_type: string
          subject_category: string
          template_name: string
          template_pattern: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty_level?: string
          id?: string
          question_type?: string
          subject_category?: string
          template_name?: string
          template_pattern?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      grade11_quiz_sessions: {
        Row: {
          answers: Json
          completed_at: string | null
          created_at: string
          current_question_index: number
          expires_at: string
          id: string
          lesson_id: string
          max_score: number
          quiz_config: Json
          score: number
          shuffled_choices: Json
          shuffled_questions: Json
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          current_question_index?: number
          expires_at?: string
          id?: string
          lesson_id: string
          max_score?: number
          quiz_config?: Json
          score?: number
          shuffled_choices?: Json
          shuffled_questions?: Json
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          current_question_index?: number
          expires_at?: string
          id?: string
          lesson_id?: string
          max_score?: number
          quiz_config?: Json
          score?: number
          shuffled_choices?: Json
          shuffled_questions?: Json
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      grade11_scoring_config: {
        Row: {
          accuracy_multiplier: number | null
          base_points: number
          config_name: string
          created_at: string | null
          difficulty_multipliers: Json
          id: string
          perfect_score_bonus: number | null
          speed_completion_threshold: number | null
          streak_bonus_points: number | null
          time_bonus_multiplier: number | null
          updated_at: string | null
        }
        Insert: {
          accuracy_multiplier?: number | null
          base_points?: number
          config_name: string
          created_at?: string | null
          difficulty_multipliers?: Json
          id?: string
          perfect_score_bonus?: number | null
          speed_completion_threshold?: number | null
          streak_bonus_points?: number | null
          time_bonus_multiplier?: number | null
          updated_at?: string | null
        }
        Update: {
          accuracy_multiplier?: number | null
          base_points?: number
          config_name?: string
          created_at?: string | null
          difficulty_multipliers?: Json
          id?: string
          perfect_score_bonus?: number | null
          speed_completion_threshold?: number | null
          streak_bonus_points?: number | null
          time_bonus_multiplier?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      grade11_sections: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      grade11_topics: {
        Row: {
          content: string | null
          created_at: string
          id: string
          order_index: number
          section_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          order_index?: number
          section_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          order_index?: number
          section_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade11_topics_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "grade11_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_videos: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration: string | null
          grade_level: string
          id: string
          is_active: boolean | null
          is_visible: boolean | null
          order_index: number | null
          owner_user_id: string
          school_id: string | null
          source_type: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          grade_level?: string
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          owner_user_id: string
          school_id?: string | null
          source_type?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          grade_level?: string
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          owner_user_id?: string
          school_id?: string | null
          source_type?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      grade12_default_tasks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          phase_number: number
          phase_title: string
          task_description: string | null
          task_title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          phase_number: number
          phase_title: string
          task_description?: string | null
          task_title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          phase_number?: number
          phase_title?: string
          task_description?: string | null
          task_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      grade12_documents: {
        Row: {
          allowed_roles: string[] | null
          category: string | null
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_active: boolean | null
          is_visible: boolean | null
          order_index: number | null
          owner_user_id: string
          published_at: string | null
          school_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          allowed_roles?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          owner_user_id: string
          published_at?: string | null
          school_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          allowed_roles?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          owner_user_id?: string
          published_at?: string | null
          school_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      grade12_final_projects: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          grade: number | null
          id: string
          project_content: string | null
          school_id: string | null
          status: string
          student_id: string
          submitted_at: string | null
          teacher_feedback: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          grade?: number | null
          id?: string
          project_content?: string | null
          school_id?: string | null
          status?: string
          student_id: string
          submitted_at?: string | null
          teacher_feedback?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          grade?: number | null
          id?: string
          project_content?: string | null
          school_id?: string | null
          status?: string
          student_id?: string
          submitted_at?: string | null
          teacher_feedback?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      grade12_project_comments: {
        Row: {
          comment: string
          comment_type: string
          created_at: string
          created_by: string
          id: string
          is_read: boolean | null
          project_id: string
        }
        Insert: {
          comment: string
          comment_type?: string
          created_at?: string
          created_by: string
          id?: string
          is_read?: boolean | null
          project_id: string
        }
        Update: {
          comment?: string
          comment_type?: string
          created_at?: string
          created_by?: string
          id?: string
          is_read?: boolean | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade12_project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "grade12_final_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade12_project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "teacher_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      grade12_project_revisions: {
        Row: {
          content_snapshot: string
          created_at: string
          created_by: string
          id: string
          project_id: string
          revision_note: string | null
        }
        Insert: {
          content_snapshot: string
          created_at?: string
          created_by: string
          id?: string
          project_id: string
          revision_note?: string | null
        }
        Update: {
          content_snapshot?: string
          created_at?: string
          created_by?: string
          id?: string
          project_id?: string
          revision_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade12_project_revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "grade12_final_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade12_project_revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "teacher_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      grade12_project_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          order_index: number
          parent_task_id: string | null
          project_id: string | null
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          order_index?: number
          parent_task_id?: string | null
          project_id?: string | null
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          order_index?: number
          parent_task_id?: string | null
          project_id?: string | null
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade12_project_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "grade12_project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade12_project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "grade12_final_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade12_project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "teacher_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      grade12_student_task_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          default_task_id: string
          id: string
          is_completed: boolean
          notes: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          default_task_id: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          default_task_id?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade12_student_task_progress_default_task_id_fkey"
            columns: ["default_task_id"]
            isOneToOne: false
            referencedRelation: "grade12_default_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      grade12_videos: {
        Row: {
          allowed_roles: string[] | null
          category: string | null
          created_at: string
          description: string | null
          duration: string | null
          file_size: number | null
          id: string
          is_active: boolean | null
          is_visible: boolean | null
          order_index: number | null
          owner_user_id: string
          published_at: string | null
          school_id: string | null
          source_type: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          allowed_roles?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          owner_user_id: string
          published_at?: string | null
          school_id?: string | null
          source_type?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          allowed_roles?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          order_index?: number | null
          owner_user_id?: string
          published_at?: string | null
          school_id?: string | null
          source_type?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      guardians: {
        Row: {
          created_at: string | null
          id: string
          parent_user_id: string
          relationship: string | null
          student_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          parent_user_id: string
          relationship?: string | null
          student_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          parent_user_id?: string
          relationship?: string | null
          student_user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      loading_settings: {
        Row: {
          created_at: string
          enabled: boolean | null
          file_name: string | null
          id: string
          is_enabled: boolean
          loop: boolean | null
          lottie_data: Json | null
          speed: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          file_name?: string | null
          id?: string
          is_enabled?: boolean
          loop?: boolean | null
          lottie_data?: Json | null
          speed?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          file_name?: string | null
          id?: string
          is_enabled?: boolean
          loop?: boolean | null
          lottie_data?: Json | null
          speed?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      package_plugins: {
        Row: {
          created_at: string
          id: string
          is_included: boolean | null
          package_id: string
          plugin_id: string
          settings: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_included?: boolean | null
          package_id: string
          plugin_id: string
          settings?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          is_included?: boolean | null
          package_id?: string
          plugin_id?: string
          settings?: Json | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          available_grade_contents: Json | null
          color: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          description_ar: string | null
          duration_days: number | null
          features: Json | null
          gradient: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_schools: number | null
          max_students: number | null
          max_teachers: number | null
          name: string
          name_ar: string
          price: number | null
          updated_at: string
        }
        Insert: {
          available_grade_contents?: Json | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          duration_days?: number | null
          features?: Json | null
          gradient?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_schools?: number | null
          max_students?: number | null
          max_teachers?: number | null
          name: string
          name_ar: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          available_grade_contents?: Json | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          duration_days?: number | null
          features?: Json | null
          gradient?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_schools?: number | null
          max_students?: number | null
          max_teachers?: number | null
          name?: string
          name_ar?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pair_matching_games: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          grade_level: string
          id: string
          is_active: boolean | null
          level_number: number | null
          max_pairs: number | null
          school_id: string | null
          stage_number: number | null
          subject: string | null
          time_limit_seconds: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          grade_level?: string
          id?: string
          is_active?: boolean | null
          level_number?: number | null
          max_pairs?: number | null
          school_id?: string | null
          stage_number?: number | null
          subject?: string | null
          time_limit_seconds?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          grade_level?: string
          id?: string
          is_active?: boolean | null
          level_number?: number | null
          max_pairs?: number | null
          school_id?: string | null
          stage_number?: number | null
          subject?: string | null
          time_limit_seconds?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pair_matching_pairs: {
        Row: {
          created_at: string | null
          explanation: string | null
          game_id: string
          id: string
          left_content: string
          left_type: string | null
          order_index: number | null
          right_content: string
          right_type: string | null
        }
        Insert: {
          created_at?: string | null
          explanation?: string | null
          game_id: string
          id?: string
          left_content: string
          left_type?: string | null
          order_index?: number | null
          right_content: string
          right_type?: string | null
        }
        Update: {
          created_at?: string | null
          explanation?: string | null
          game_id?: string
          id?: string
          left_content?: string
          left_type?: string | null
          order_index?: number | null
          right_content?: string
          right_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pair_matching_pairs_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "pair_matching_games"
            referencedColumns: ["id"]
          },
        ]
      }
      pair_matching_results: {
        Row: {
          attempts_count: number | null
          id: string
          is_correct: boolean
          matched_at: string | null
          pair_id: string
          session_id: string
          time_taken: number | null
        }
        Insert: {
          attempts_count?: number | null
          id?: string
          is_correct: boolean
          matched_at?: string | null
          pair_id: string
          session_id: string
          time_taken?: number | null
        }
        Update: {
          attempts_count?: number | null
          id?: string
          is_correct?: boolean
          matched_at?: string | null
          pair_id?: string
          session_id?: string
          time_taken?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pair_matching_results_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "pair_matching_pairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pair_matching_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pair_matching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pair_matching_sessions: {
        Row: {
          completed_at: string | null
          completion_time: number | null
          game_id: string
          id: string
          max_score: number | null
          mistakes_count: number | null
          pairs_matched: number | null
          player_id: string
          score: number | null
          session_data: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          completion_time?: number | null
          game_id: string
          id?: string
          max_score?: number | null
          mistakes_count?: number | null
          pairs_matched?: number | null
          player_id: string
          score?: number | null
          session_data?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          completion_time?: number | null
          game_id?: string
          id?: string
          max_score?: number | null
          mistakes_count?: number | null
          pairs_matched?: number | null
          player_id?: string
          score?: number | null
          session_data?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pair_matching_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "pair_matching_games"
            referencedColumns: ["id"]
          },
        ]
      }
      player_game_progress: {
        Row: {
          best_score: number | null
          completion_count: number | null
          created_at: string
          first_completed_at: string | null
          game_id: string
          id: string
          is_completed: boolean
          is_unlocked: boolean
          last_played_at: string | null
          player_id: string
          updated_at: string
        }
        Insert: {
          best_score?: number | null
          completion_count?: number | null
          created_at?: string
          first_completed_at?: string | null
          game_id: string
          id?: string
          is_completed?: boolean
          is_unlocked?: boolean
          last_played_at?: string | null
          player_id: string
          updated_at?: string
        }
        Update: {
          best_score?: number | null
          completion_count?: number | null
          created_at?: string
          first_completed_at?: string | null
          game_id?: string
          id?: string
          is_completed?: boolean
          is_unlocked?: boolean
          last_played_at?: string | null
          player_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_game_progress_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "pair_matching_games"
            referencedColumns: ["id"]
          },
        ]
      }
      plugins: {
        Row: {
          category: string
          created_at: string
          default_status: Database["public"]["Enums"]["plugin_status"]
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          name: string
          name_ar: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          default_status?: Database["public"]["Enums"]["plugin_status"]
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          name: string
          name_ar: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_status?: Database["public"]["Enums"]["plugin_status"]
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      professional_documents: {
        Row: {
          allow_comments: boolean
          allow_suggestions: boolean
          content: Json
          created_at: string
          html_content: string | null
          id: string
          last_saved_at: string
          owner_id: string
          page_count: number | null
          plain_text: string | null
          school_id: string | null
          title: string
          updated_at: string
          version_number: number
          visibility: string
          word_count: number | null
        }
        Insert: {
          allow_comments?: boolean
          allow_suggestions?: boolean
          content?: Json
          created_at?: string
          html_content?: string | null
          id?: string
          last_saved_at?: string
          owner_id: string
          page_count?: number | null
          plain_text?: string | null
          school_id?: string | null
          title: string
          updated_at?: string
          version_number?: number
          visibility?: string
          word_count?: number | null
        }
        Update: {
          allow_comments?: boolean
          allow_suggestions?: boolean
          content?: Json
          created_at?: string
          html_content?: string | null
          id?: string
          last_saved_at?: string
          owner_id?: string
          page_count?: number | null
          plain_text?: string | null
          school_id?: string | null
          title?: string
          updated_at?: string
          version_number?: number
          visibility?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_professional_documents_school"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_title: string | null
          email: string | null
          full_name: string
          is_primary_admin: boolean | null
          level: number | null
          phone: string | null
          points: number | null
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_title?: string | null
          email?: string | null
          full_name: string
          is_primary_admin?: boolean | null
          level?: number | null
          phone?: string | null
          points?: number | null
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_title?: string | null
          email?: string | null
          full_name?: string
          is_primary_admin?: boolean | null
          level?: number | null
          phone?: string | null
          points?: number | null
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      project_submissions: {
        Row: {
          graded_at: string | null
          graded_by: string | null
          id: string
          notes: string | null
          project_id: string
          score: number | null
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          notes?: string | null
          project_id: string
          score?: number | null
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_at: string | null
          id: string
          order_index: number
          project_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          order_index?: number
          project_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          order_index?: number
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          course_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          max_score: number | null
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          max_score?: number | null
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          max_score?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank: {
        Row: {
          choices: Json | null
          correct_answer: string | null
          created_at: string
          created_by: string | null
          difficulty_level: Database["public"]["Enums"]["question_difficulty"]
          explanation: string | null
          id: string
          is_active: boolean | null
          lesson_id: string | null
          points: number | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          school_id: string | null
          section_id: string | null
          tags: string[] | null
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          choices?: Json | null
          correct_answer?: string | null
          created_at?: string
          created_by?: string | null
          difficulty_level?: Database["public"]["Enums"]["question_difficulty"]
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          lesson_id?: string | null
          points?: number | null
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
          school_id?: string | null
          section_id?: string | null
          tags?: string[] | null
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          choices?: Json | null
          correct_answer?: string | null
          created_at?: string
          created_by?: string | null
          difficulty_level?: Database["public"]["Enums"]["question_difficulty"]
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          lesson_id?: string | null
          points?: number | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          school_id?: string | null
          section_id?: string | null
          tags?: string[] | null
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "grade11_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "question_bank_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "grade11_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank_sections: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          grade_level: string
          id: string
          is_active: boolean
          order_index: number
          school_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          grade_level?: string
          id?: string
          is_active?: boolean
          order_index?: number
          school_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          grade_level?: string
          id?: string
          is_active?: boolean
          order_index?: number
          school_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      school_packages: {
        Row: {
          auto_renew: boolean | null
          created_at: string
          end_date: string | null
          id: string
          package_id: string
          payment_method: string | null
          school_id: string
          start_date: string
          status: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string
          end_date?: string | null
          id?: string
          package_id: string
          payment_method?: string | null
          school_id: string
          start_date?: string
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string
          end_date?: string | null
          id?: string
          package_id?: string
          payment_method?: string | null
          school_id?: string
          start_date?: string
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_school_packages_package_id"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_school_packages_school_id"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_plugins: {
        Row: {
          created_at: string
          enabled_at: string | null
          id: string
          plugin_id: string
          school_id: string
          settings: Json | null
          status: Database["public"]["Enums"]["plugin_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled_at?: string | null
          id?: string
          plugin_id: string
          school_id: string
          settings?: Json | null
          status?: Database["public"]["Enums"]["plugin_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled_at?: string | null
          id?: string
          plugin_id?: string
          school_id?: string
          settings?: Json | null
          status?: Database["public"]["Enums"]["plugin_status"]
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          city: string | null
          created_at: string | null
          id: string
          name: string
          plan: Database["public"]["Enums"]["school_plan"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at_utc: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          plan?: Database["public"]["Enums"]["school_plan"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at_utc?: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          plan?: Database["public"]["Enums"]["school_plan"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at_utc?: string
        }
        Relationships: []
      }
      student_achievements: {
        Row: {
          achievement_description: string | null
          achievement_name: string
          achievement_type: string
          earned_at: string
          id: string
          metadata: Json | null
          points_value: number
          school_id: string
          student_id: string
        }
        Insert: {
          achievement_description?: string | null
          achievement_name: string
          achievement_type: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          points_value?: number
          school_id: string
          student_id: string
        }
        Update: {
          achievement_description?: string | null
          achievement_name?: string
          achievement_type?: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          points_value?: number
          school_id?: string
          student_id?: string
        }
        Relationships: []
      }
      student_activity_log: {
        Row: {
          activity_type: string
          content_id: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          metadata: Json | null
          points_earned: number | null
          school_id: string
          student_id: string
        }
        Insert: {
          activity_type: string
          content_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
          school_id: string
          student_id: string
        }
        Update: {
          activity_type?: string
          content_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
          school_id?: string
          student_id?: string
        }
        Relationships: []
      }
      student_daily_challenges: {
        Row: {
          challenge_date: string
          challenge_description: string | null
          challenge_title: string
          challenge_type: string
          completed: boolean
          completed_at: string | null
          current_progress: number
          id: string
          points_reward: number
          school_id: string
          student_id: string
          target_value: number
        }
        Insert: {
          challenge_date?: string
          challenge_description?: string | null
          challenge_title: string
          challenge_type: string
          completed?: boolean
          completed_at?: string | null
          current_progress?: number
          id?: string
          points_reward?: number
          school_id: string
          student_id: string
          target_value: number
        }
        Update: {
          challenge_date?: string
          challenge_description?: string | null
          challenge_title?: string
          challenge_type?: string
          completed?: boolean
          completed_at?: string | null
          current_progress?: number
          id?: string
          points_reward?: number
          school_id?: string
          student_id?: string
          target_value?: number
        }
        Relationships: []
      }
      student_notifications: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          project_id: string | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          notification_type?: string
          project_id?: string | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          project_id?: string | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "grade12_project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "grade12_final_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "teacher_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          completed_at: string | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          points_earned: number
          progress_percentage: number
          school_id: string
          student_id: string
          time_spent_minutes: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          points_earned?: number
          progress_percentage?: number
          school_id: string
          student_id: string
          time_spent_minutes?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          points_earned?: number
          progress_percentage?: number
          school_id?: string
          student_id?: string
          time_spent_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at_utc: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          school_id: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          created_at_utc?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          school_id: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          created_at_utc?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          school_id?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      system_audio_files: {
        Row: {
          audio_type: string
          created_at: string | null
          created_by: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          audio_type: string
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          audio_type?: string
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_audio_settings: {
        Row: {
          audio_type: string
          created_at: string
          created_by: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          audio_type: string
          created_at?: string
          created_by?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          audio_type?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      teacher_classes: {
        Row: {
          class_id: string
          created_at_utc: string
          id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at_utc?: string
          id?: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at_utc?: string
          id?: string
          teacher_id?: string
        }
        Relationships: []
      }
      teacher_content_settings: {
        Row: {
          allow_cross_grade_access: boolean
          created_at: string
          created_by: string
          id: string
          restrict_to_assigned_grades: boolean
          school_id: string
          show_all_package_content: boolean
          updated_at: string
        }
        Insert: {
          allow_cross_grade_access?: boolean
          created_at?: string
          created_by: string
          id?: string
          restrict_to_assigned_grades?: boolean
          school_id: string
          show_all_package_content?: boolean
          updated_at?: string
        }
        Update: {
          allow_cross_grade_access?: boolean
          created_at?: string
          created_by?: string
          id?: string
          restrict_to_assigned_grades?: boolean
          school_id?: string
          show_all_package_content?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      teacher_notifications: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          notification_type: string
          project_id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string
          project_id: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string
          project_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "grade12_project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "grade12_final_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "teacher_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_audio_settings: {
        Row: {
          created_at: string
          id: string
          sound_enabled: boolean | null
          updated_at: string
          user_id: string
          volume_level: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          sound_enabled?: boolean | null
          updated_at?: string
          user_id: string
          volume_level?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          sound_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          volume_level?: number | null
        }
        Relationships: []
      }
      video_progress: {
        Row: {
          completed: boolean | null
          id: string
          last_position: number | null
          last_watched_at: string | null
          lesson_id: string | null
          task_id: string | null
          total_duration: number | null
          user_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          id?: string
          last_position?: number | null
          last_watched_at?: string | null
          lesson_id?: string | null
          task_id?: string | null
          total_duration?: number | null
          user_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          id?: string
          last_position?: number | null
          last_watched_at?: string | null
          lesson_id?: string | null
          task_id?: string | null
          total_duration?: number | null
          user_id?: string
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      teacher_assigned_grades: {
        Row: {
          grade_level_id: string | null
          grade_level_label: string | null
          school_id: string | null
          teacher_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_projects_view: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          description: string | null
          grade: number | null
          id: string | null
          school_id: string | null
          status: string | null
          student_id: string | null
          student_name: string | null
          title: string | null
          total_comments_count: number | null
          unread_comments_count: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_student_title: {
        Args: { user_points: number }
        Returns: string
      }
      can_teacher_access_project: {
        Args: {
          project_student_id: string
          project_type: string
          teacher_user_id: string
        }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          attempt_type_input: string
          block_duration_minutes?: number
          identifier_input: string
          max_attempts?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_pins: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_quiz_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_available_grade_levels: {
        Args: { school_uuid: string }
        Returns: string[]
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_school_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_exam_question_for_student: {
        Args: { question_id: string }
        Returns: Json
      }
      get_school_active_package: {
        Args: { school_uuid: string }
        Returns: Json
      }
      get_school_content_settings: {
        Args: { school_uuid: string }
        Returns: Json
      }
      get_school_package_with_usage: {
        Args: { school_uuid: string }
        Returns: Json
      }
      get_student_assigned_grade: {
        Args: { student_user_id: string }
        Returns: string
      }
      get_student_dashboard_stats: {
        Args: { student_uuid: string }
        Returns: Json
      }
      get_student_total_points: {
        Args: { student_uuid: string }
        Returns: number
      }
      get_students_for_school_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at_utc: string
          email: string
          full_name: string
          id: string
          phone: string
          school_id: string
          username: string
        }[]
      }
      get_students_for_teacher: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at_utc: string
          full_name: string
          id: string
          school_id: string
          username: string
        }[]
      }
      get_teacher_assigned_grade_levels: {
        Args: { teacher_user_id: string }
        Returns: string[]
      }
      get_teacher_assigned_projects: {
        Args: { project_grade: string; teacher_user_id: string }
        Returns: {
          is_authorized: boolean
          project_id: string
          student_grade: string
          student_id: string
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_school_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      initialize_player_progress: {
        Args: { p_player_id: string }
        Returns: undefined
      }
      unlock_next_games: {
        Args: { p_completed_game_id: string; p_player_id: string }
        Returns: undefined
      }
      validate_email_format: {
        Args: { email_input: string }
        Returns: boolean
      }
      validate_phone_format: {
        Args: { phone_input: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "superadmin" | "school_admin" | "teacher" | "student" | "parent"
      file_kind: "pkt" | "pdf" | "image" | "video" | "document"
      media_type: "video" | "lottie" | "image" | "code"
      plugin_status: "enabled" | "disabled" | "in_development" | "coming_soon"
      question_difficulty: "easy" | "medium" | "hard"
      question_type: "multiple_choice" | "true_false" | "short_answer"
      school_plan: "basic" | "pro"
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
      app_role: ["superadmin", "school_admin", "teacher", "student", "parent"],
      file_kind: ["pkt", "pdf", "image", "video", "document"],
      media_type: ["video", "lottie", "image", "code"],
      plugin_status: ["enabled", "disabled", "in_development", "coming_soon"],
      question_difficulty: ["easy", "medium", "hard"],
      question_type: ["multiple_choice", "true_false", "short_answer"],
      school_plan: ["basic", "pro"],
    },
  },
} as const
