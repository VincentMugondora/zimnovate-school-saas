import type { APIRoute } from 'astro';
import { getAuthFromCookie } from '../../lib/auth';
import { getStudents, getAttendance, getGrades, getClasses } from '../../lib/db';

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    const auth = getAuthFromCookie(cookies);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const schoolId = auth.school_id;
    const lastSync = url.searchParams.get('lastSync');
    const table = url.searchParams.get('table');

    let data: any = {};

    if (!table || table === 'students') {
      data.students = await getStudents(schoolId);
    }

    if (!table || table === 'attendance') {
      const date = url.searchParams.get('date');
      data.attendance = await getAttendance(schoolId, date || undefined);
    }

    if (!table || table === 'grades') {
      const studentId = url.searchParams.get('studentId');
      data.grades = await getGrades(schoolId, studentId || undefined);
    }

    if (!table || table === 'classes') {
      data.classes = await getClasses(schoolId, auth.role === 'teacher' ? auth.id : undefined);
    }

    return new Response(JSON.stringify({ 
      data,
      timestamp: new Date().toISOString(),
      schoolId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sync GET error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const auth = getAuthFromCookie(cookies);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { changes } = await request.json();
    
    if (!changes || !Array.isArray(changes)) {
      return new Response(JSON.stringify({ error: 'Invalid changes data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const results = [];
    
    for (const change of changes) {
      const { table, action, data } = change;
      
      try {
        let result;
        
        switch (table) {
          case 'attendance':
            if (action === 'update') {
              // Handle attendance update
              const { updateAttendance } = await import('../../lib/db');
              result = await updateAttendance(data.id, data.status);
            }
            break;
            
          case 'grades':
            if (action === 'create') {
              const { createGrade } = await import('../../lib/db');
              result = await createGrade(data);
            } else if (action === 'update') {
              // Handle grade update - you'd need to implement this
              result = { success: true, message: 'Grade update not implemented yet' };
            }
            break;
            
          case 'students':
            if (action === 'create') {
              const { createStudent } = await import('../../lib/db');
              result = await createStudent(data);
            } else if (action === 'update') {
              const { updateStudent } = await import('../../lib/db');
              const { id, ...updates } = data;
              result = await updateStudent(id, updates);
            }
            break;
            
          default:
            result = { success: false, error: 'Unknown table' };
        }
        
        results.push({
          table,
          action,
          id: data.id,
          success: !!result,
          data: result
        });
        
      } catch (error) {
        console.error(`Error processing change for ${table}:`, error);
        results.push({
          table,
          action,
          id: data.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(JSON.stringify({ 
      results,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sync POST error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
