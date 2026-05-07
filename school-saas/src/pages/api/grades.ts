import type { APIRoute } from 'astro';
import { getAuthFromCookie } from '../../lib/auth';
import { getGrades, createGrade } from '../../lib/db';
import { supabase } from '../../lib/db';

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
    const studentId = url.searchParams.get('studentId');
    const classId = url.searchParams.get('classId');
    const gradingPeriod = url.searchParams.get('gradingPeriod');

    let grades = await getGrades(schoolId, studentId || undefined);

    // Filter by class
    if (classId) {
      grades = grades.filter(grade => grade.class_id === classId);
    }

    // Filter by grading period
    if (gradingPeriod) {
      grades = grades.filter(grade => grade.grading_period === gradingPeriod);
    }

    // Parents can only see their own children's grades
    if (auth.role === 'parent') {
      // In a real app, you'd get the parent's children from a relationships table
      // For now, we'll require studentId for parents
      if (!studentId) {
        return new Response(JSON.stringify({ error: 'Parents must specify student ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ grades }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Grades GET error:', error);
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

    const gradeData = await request.json();
    
    // Validate required fields
    if (!gradeData.student_id || !gradeData.class_id || gradeData.grade === undefined || !gradeData.grading_period) {
      return new Response(JSON.stringify({ error: 'Missing required fields: student_id, class_id, grade, grading_period' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate grade value
    if (typeof gradeData.grade !== 'number' || gradeData.grade < 0 || gradeData.grade > 100) {
      return new Response(JSON.stringify({ error: 'Grade must be a number between 0 and 100' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if grade record already exists for this student, class, and grading period
    const { data: existingRecord } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', gradeData.student_id)
      .eq('class_id', gradeData.class_id)
      .eq('grading_period', gradeData.grading_period)
      .single();

    let result;
    
    if (existingRecord) {
      // Update existing record
      const { data, error } = await supabase
        .from('grades')
        .update({ 
          grade: gradeData.grade,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating grade:', error);
        return new Response(JSON.stringify({ error: 'Failed to update grade' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      result = data;
    } else {
      // Create new record
      const newGrade = {
        ...gradeData,
        school_id: auth.school_id,
        id: crypto.randomUUID()
      };
      
      result = await createGrade(newGrade);
      
      if (!result) {
        return new Response(JSON.stringify({ error: 'Failed to create grade' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ grade: result }), {
      status: existingRecord ? 200 : 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Grades POST error:', error);
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

    const { id, grade } = await request.json();
    
    if (!id || grade === undefined) {
      return new Response(JSON.stringify({ error: 'Grade ID and grade value are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate grade value
    if (typeof grade !== 'number' || grade < 0 || grade > 100) {
      return new Response(JSON.stringify({ error: 'Grade must be a number between 0 and 100' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await supabase
      .from('grades')
      .update({ 
        grade,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('school_id', auth.school_id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating grade:', error);
      return new Response(JSON.stringify({ error: 'Failed to update grade' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!data) {
      return new Response(JSON.stringify({ error: 'Grade not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ grade: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Grades PUT error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
