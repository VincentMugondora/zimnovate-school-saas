import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageIndexedDB } from 'rxdb/plugins/storage-indexed-db';
import { replicateWithSupabase } from 'rxdb-plugins/supabase';
import type { Student, Attendance, Grade } from './types';

let db: any = null;

export async function initRxDB() {
  if (db) return db;

  try {
    db = await createRxDatabase({
      name: 'school_saas',
      storage: getRxStorageIndexedDB(),
      multiInstance: true,
      ignoreDuplicate: true
    });

    // Create collections
    await db.addCollections({
      students: {
        schema: {
          title: 'student',
          version: 0,
          type: 'object',
          primaryKey: 'id',
          properties: {
            id: { type: 'string' },
            school_id: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string' },
            enrollment_date: { type: 'string' },
            grade_level: { type: 'integer' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' }
          },
          required: ['id', 'school_id', 'first_name', 'last_name']
        }
      },
      attendance: {
        schema: {
          title: 'attendance',
          version: 0,
          type: 'object',
          primaryKey: 'id',
          properties: {
            id: { type: 'string' },
            school_id: { type: 'string' },
            student_id: { type: 'string' },
            class_id: { type: 'string' },
            date: { type: 'string' },
            status: { type: 'string' },
            created_at: { type: 'string' }
          },
          required: ['id', 'school_id', 'student_id', 'date', 'status']
        }
      },
      grades: {
        schema: {
          title: 'grade',
          version: 0,
          type: 'object',
          primaryKey: 'id',
          properties: {
            id: { type: 'string' },
            school_id: { type: 'string' },
            student_id: { type: 'string' },
            class_id: { type: 'string' },
            grade: { type: 'number' },
            grading_period: { type: 'string' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' }
          },
          required: ['id', 'school_id', 'student_id', 'grade']
        }
      }
    });

    console.log('RxDB initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing RxDB:', error);
    throw error;
  }
}

export function getRxDB() {
  if (!db) throw new Error('RxDB not initialized');
  return db;
}

export async function syncWithSupabase(schoolId: string) {
  if (!db) {
    await initRxDB();
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found, skipping sync');
    return;
  }

  try {
    // Sync students
    const studentsCollection = db.students;
    const studentsReplication = await studentsCollection.syncWithSupabase({
      supabaseUrl,
      supabaseKey,
      table: 'students',
      query: () => ({ school_id: schoolId }),
      pull: {
        batchSize: 100,
        modifier: (doc: any) => doc
      },
      push: {
        batchSize: 100,
        modifier: (doc: any) => doc
      }
    });

    // Sync attendance
    const attendanceCollection = db.attendance;
    const attendanceReplication = await attendanceCollection.syncWithSupabase({
      supabaseUrl,
      supabaseKey,
      table: 'attendance',
      query: () => ({ school_id: schoolId }),
      pull: {
        batchSize: 100,
        modifier: (doc: any) => doc
      },
      push: {
        batchSize: 100,
        modifier: (doc: any) => doc
      }
    });

    // Sync grades
    const gradesCollection = db.grades;
    const gradesReplication = await gradesCollection.syncWithSupabase({
      supabaseUrl,
      supabaseKey,
      table: 'grades',
      query: () => ({ school_id: schoolId }),
      pull: {
        batchSize: 100,
        modifier: (doc: any) => doc
      },
      push: {
        batchSize: 100,
        modifier: (doc: any) => doc
      }
    });

    console.log('Sync with Supabase started');
    
    return {
      students: studentsReplication,
      attendance: attendanceReplication,
      grades: gradesReplication
    };
  } catch (error) {
    console.error('Error setting up sync:', error);
    throw error;
  }
}

export async function addStudentLocal(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) {
  if (!db) await initRxDB();
  
  const studentWithId = {
    ...student,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return await db.students.insert(studentWithId);
}

export async function updateAttendanceLocal(id: string, status: string) {
  if (!db) await initRxDB();
  
  return await db.attendance.upsert({
    id,
    status,
    updated_at: new Date().toISOString()
  });
}

export async function getLocalStudents(schoolId: string): Promise<Student[]> {
  if (!db) await initRxDB();
  
  const students = await db.students.find({
    selector: {
      school_id: schoolId
    }
  }).exec();
  
  return students.map((doc: any) => doc.toJSON());
}

export async function getLocalAttendance(schoolId: string, date?: string): Promise<Attendance[]> {
  if (!db) await initRxDB();
  
  let selector: any = { school_id: schoolId };
  if (date) {
    selector.date = date;
  }
  
  const attendance = await db.attendance.find({
    selector
  }).exec();
  
  return attendance.map((doc: any) => doc.toJSON());
}
