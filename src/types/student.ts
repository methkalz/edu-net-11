// أنواع الطلاب والبيانات المرتبطة بهم
export interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  username?: string;
  class_id?: string;
  school_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface StudentFormData {
  full_name: string;
  email: string;
  phone?: string;
  username?: string;
  class_id?: string;
}

export interface StudentUpdateData {
  full_name?: string;
  email?: string;
  phone?: string;
  username?: string;
  class_id?: string;
  is_active?: boolean;
}

export interface StudentImportData {
  full_name: string;
  email: string;
  phone?: string;
  username?: string;
  password?: string;
}

export interface StudentWithClass extends Student {
  classes?: {
    name: string;
    grade_level: string;
  };
}

export interface EncryptedStudentData {
  full_name?: string;
  email?: string;
  phone?: string;
  username?: string;
}

export interface FormattedStudent {
  id: string;
  name?: string;
  full_name: string;
  email?: string;
  class?: string;
  joinDate?: string;
  created_at?: string;
  username?: string;
}