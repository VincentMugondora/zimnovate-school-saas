import { createClient } from '@supabase/supabase-js';
import type { User, Student, Attendance, Grade, Class, School } from './types';

// Import WebSocket polyfill for Node.js 20 compatibility
import './websocket-polyfill.js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Configure Supabase client options
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, supabaseOptions);
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || supabaseKey, supabaseOptions);

// Helper to handle timeouts for Supabase calls
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Database timeout')), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

// Mock data for demo purposes
const MOCK_STUDENTS: Student[] = [
  { id: 's1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', school_id: 'demo-school', created_at: new Date().toISOString() },
  { id: 's2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', school_id: 'demo-school', created_at: new Date().toISOString() }
];

const MOCK_CLASSES: Class[] = [
  { id: 'c1', name: 'Mathematics 101', school_id: 'demo-school', teacher_id: 'demo-teacher-id' },
  { id: 'c2', name: 'Science 202', school_id: 'demo-school', teacher_id: 'demo-teacher-id' }
];

const MOCK_ATTENDANCE: Attendance[] = [
  { id: 'a1', student_id: 's1', class_id: 'c1', date: new Date().toISOString().split('T')[0], status: 'present', school_id: 'demo-school' },
  { id: 'a2', student_id: 's2', class_id: 'c1', date: new Date().toISOString().split('T')[0], status: 'absent', school_id: 'demo-school' }
];

const MOCK_GRADES: Grade[] = [
  { id: 'g1', student_id: 's1', class_id: 'c1', grade: 'A', comments: 'Excellent work', school_id: 'demo-school', created_at: new Date().toISOString() },
  { id: 'g2', student_id: 's2', class_id: 'c1', grade: 'B', comments: 'Good progress', school_id: 'demo-school', created_at: new Date().toISOString() }
];

const MOCK_USERS: User[] = [
  { id: 'demo-admin-id', email: 'admin@school.com', role: 'admin', first_name: 'Demo', last_name: 'Admin', school_id: 'demo-school' },
  { id: 'demo-teacher-id', email: 'teacher@school.com', role: 'teacher', first_name: 'Demo', last_name: 'Teacher', school_id: 'demo-school' },
  { id: 'demo-parent-id', email: 'parent@school.com', role: 'parent', first_name: 'Demo', last_name: 'Parent', school_id: 'demo-school' }
];

// Helper to sanitize UUIDs and handle "null" strings
function sanitizeId(id: string | null | undefined): string | null {
  if (!id || id === 'null' || id === 'undefined') return null;
  return id;
}

export async function getUser(email: string): Promise<User | null> {
  try {
    const { data, error } = await withTimeout(supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single());
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user, checking mock:', error.message);
    return MOCK_USERS.find(u => u.email === email) || null;
  }
}

export async function getUsers(schoolId: string): Promise<User[]> {
  const sanitizedSchoolId = sanitizeId(schoolId);
  if (!sanitizedSchoolId) return [];

  try {
    const { data, error } = await withTimeout(supabaseAdmin
      .from('users')
      .select('*')
      .eq('school_id', sanitizedSchoolId));
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users, using mock data:', error);
    if (sanitizedSchoolId.includes('demo')) return MOCK_USERS;
    return [];
  }
}

export async function createUser(userData: Omit<User, 'id' | 'created_at'> & { password_hash?: string }): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([userData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user:', error);
    return null;
  }
  return data;
}

export async function getStudents(schoolId: string): Promise<Student[]> {
  const sanitizedSchoolId = sanitizeId(schoolId);
  if (!sanitizedSchoolId) return [];

  try {
    const { data, error } = await withTimeout(supabase
      .from('students')
      .select('*')
      .eq('school_id', sanitizedSchoolId)
      .order('last_name', { ascending: true }));
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching students, using mock data:', error);
    if (sanitizedSchoolId.includes('demo')) return MOCK_STUDENTS;
    return [];
  }
}

export async function createStudent(studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .insert([studentData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating student:', error);
    return null;
  }
  return data;
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating student:', error);
    return null;
  }
  return data;
}

export async function getAttendance(schoolId: string, date?: string): Promise<Attendance[]> {
  const sanitizedSchoolId = sanitizeId(schoolId);
  if (!sanitizedSchoolId) return [];

  try {
    let query = supabase
      .from('attendance')
      .select('*, students(*), classes(*)')
      .eq('school_id', sanitizedSchoolId);
    
    if (date) {
      query = query.eq('date', date);
    }
    
    const { data, error } = await withTimeout(query.order('date', { ascending: false }));
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching attendance, using mock data:', error);
    if (sanitizedSchoolId.includes('demo')) return MOCK_ATTENDANCE;
    return [];
  }
}

export async function updateAttendance(id: string, status: string): Promise<Attendance | null> {
  try {
    const { data, error } = await withTimeout(supabase
      .from('attendance')
      .update({ status })
      .eq('id', id)
      .select()
      .single());
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating attendance:', error);
    return null;
  }
}

export async function createAttendance(attendanceData: Omit<Attendance, 'id' | 'created_at'>): Promise<Attendance | null> {
  try {
    const { data, error } = await withTimeout(supabase
      .from('attendance')
      .insert([attendanceData])
      .select()
      .single());
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating attendance:', error);
    return null;
  }
}

export async function getGrades(schoolId: string, studentId?: string): Promise<Grade[]> {
  const sanitizedSchoolId = sanitizeId(schoolId);
  if (!sanitizedSchoolId) return [];

  try {
    let query = supabase
      .from('grades')
      .select('*, students(*), classes(*)')
      .eq('school_id', sanitizedSchoolId);
    
    const sanitizedStudentId = sanitizeId(studentId);
    if (sanitizedStudentId) {
      query = query.eq('student_id', sanitizedStudentId);
    }
    
    const { data, error } = await withTimeout(query.order('created_at', { ascending: false }));
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching grades, using mock data:', error);
    if (sanitizedSchoolId.includes('demo')) return MOCK_GRADES;
    return [];
  }
}

export async function createGrade(gradeData: Omit<Grade, 'id' | 'created_at' | 'updated_at'>): Promise<Grade | null> {
  try {
    const { data, error } = await withTimeout(supabase
      .from('grades')
      .insert([gradeData])
      .select()
      .single());
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating grade:', error);
    return null;
  }
}

export async function updateGrade(id: string, updates: Partial<Grade>): Promise<Grade | null> {
  try {
    const { data, error } = await withTimeout(supabase
      .from('grades')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single());
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating grade:', error);
    return null;
  }
}

export async function getClasses(schoolId: string, teacherId?: string): Promise<Class[]> {
  const sanitizedSchoolId = sanitizeId(schoolId);
  if (!sanitizedSchoolId) return [];

  try {
    let query = supabase
      .from('classes')
      .select('*, users(*)')
      .eq('school_id', sanitizedSchoolId);
    
    const sanitizedTeacherId = sanitizeId(teacherId);
    if (sanitizedTeacherId) {
      query = query.eq('teacher_id', sanitizedTeacherId);
    }
    
    const { data, error } = await withTimeout(query.order('name', { ascending: true }));
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching classes, using mock data:', error);
    if (sanitizedSchoolId.includes('demo')) return MOCK_CLASSES;
    return [];
  }
}
