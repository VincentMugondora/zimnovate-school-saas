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

export async function getUser(email: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return data;
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
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId)
    .order('last_name', { ascending: true });
  
  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }
  return data || [];
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
  let query = supabase
    .from('attendance')
    .select('*, students(*), classes(*)')
    .eq('school_id', schoolId);
  
  if (date) {
    query = query.eq('date', date);
  }
  
  const { data, error } = await query.order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }
  return data || [];
}

export async function updateAttendance(id: string, status: string): Promise<Attendance | null> {
  const { data, error } = await supabase
    .from('attendance')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating attendance:', error);
    return null;
  }
  return data;
}

export async function getGrades(schoolId: string, studentId?: string): Promise<Grade[]> {
  let query = supabase
    .from('grades')
    .select('*, students(*), classes(*)')
    .eq('school_id', schoolId);
  
  if (studentId) {
    query = query.eq('student_id', studentId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching grades:', error);
    return [];
  }
  return data || [];
}

export async function createGrade(gradeData: Omit<Grade, 'id' | 'created_at' | 'updated_at'>): Promise<Grade | null> {
  const { data, error } = await supabase
    .from('grades')
    .insert([gradeData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating grade:', error);
    return null;
  }
  return data;
}

export async function getClasses(schoolId: string, teacherId?: string): Promise<Class[]> {
  let query = supabase
    .from('classes')
    .select('*, users(*)')
    .eq('school_id', schoolId);
  
  if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }
  
  const { data, error } = await query.order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
  return data || [];
}
