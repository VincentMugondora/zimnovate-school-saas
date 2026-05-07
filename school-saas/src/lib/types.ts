export type UserRole = 'admin' | 'teacher' | 'parent';

export interface User {
  id: string;
  school_id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  email: string;
  enrollment_date: string;
  grade_level: number;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  school_id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  created_at: string;
}

export interface Grade {
  id: string;
  school_id: string;
  student_id: string;
  class_id: string;
  grade: number;
  grading_period: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  teacher_id: string;
  name: string;
  subject: string;
  grade_level: number;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  created_at: string;
}
