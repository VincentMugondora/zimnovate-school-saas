import type { APIRoute } from 'astro';
import { getAuthFromCookie } from '../../lib/auth';
import { getStudents, createStudent, updateStudent } from '../../lib/db';

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
    const search = url.searchParams.get('search');
    const grade = url.searchParams.get('grade');

    let students = await getStudents(schoolId);

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(student => 
        student.first_name.toLowerCase().includes(searchLower) ||
        student.last_name.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by grade level
    if (grade) {
      students = students.filter(student => student.grade_level === parseInt(grade));
    }

    return new Response(JSON.stringify({ students }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Students GET error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const auth = getAuthFromCookie(cookies);
    if (!auth || (auth.role !== 'admin' && auth.role !== 'teacher')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const studentData = await request.json();
    
    // Add school_id and validation
    const newStudentData = {
      ...studentData,
      school_id: auth.school_id,
      enrollment_date: studentData.enrollment_date || new Date().toISOString().split('T')[0]
    };

    // Validate required fields
    if (!newStudentData.first_name || !newStudentData.last_name) {
      return new Response(JSON.stringify({ error: 'First name and last name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const student = await createStudent(newStudentData);
    
    if (!student) {
      return new Response(JSON.stringify({ error: 'Failed to create student' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ student }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Students POST error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const auth = getAuthFromCookie(cookies);
    if (!auth || (auth.role !== 'admin' && auth.role !== 'teacher')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id, ...updates } = await request.json();
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Student ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const student = await updateStudent(id, updates);
    
    if (!student) {
      return new Response(JSON.stringify({ error: 'Student not found or update failed' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ student }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Students PUT error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
