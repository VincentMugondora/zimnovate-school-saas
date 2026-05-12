import type { APIRoute } from 'astro';
import { getAuthFromCookie } from '../../lib/auth';
import { getAttendance, updateAttendance, createAttendance } from '../../lib/db';
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
    const date = url.searchParams.get('date');
    const classId = url.searchParams.get('classId');
    const studentId = url.searchParams.get('studentId');

    let attendance = await getAttendance(schoolId, date || undefined);

    // Filter by class
    if (classId) {
      attendance = attendance.filter(record => record.class_id === classId);
    }

    // Filter by student
    if (studentId) {
      attendance = attendance.filter(record => record.student_id === studentId);
    }

    return new Response(JSON.stringify({ attendance }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Attendance GET error:', error);
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

    const attendanceData = await request.json();
    
    // Validate required fields
    if (!attendanceData.student_id || !attendanceData.class_id || !attendanceData.date || !attendanceData.status) {
      return new Response(JSON.stringify({ error: 'Missing required fields: student_id, class_id, date, status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate status
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(attendanceData.status)) {
      return new Response(JSON.stringify({ error: 'Invalid status. Must be: present, absent, late, or excused' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if attendance record already exists for this student, class, and date
    const { data: existingRecord } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', attendanceData.student_id)
      .eq('class_id', attendanceData.class_id)
      .eq('date', attendanceData.date)
      .single();

    let result;
    
    if (existingRecord) {
      // Update existing record
      result = await updateAttendance(existingRecord.id, attendanceData.status);
    } else {
      // Create new record
      result = await createAttendance({
        ...attendanceData,
        school_id: auth.school_id
      });
    }

    if (!result) {
      return new Response(JSON.stringify({ error: 'Failed to save attendance record' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ attendance: result }), {
      status: existingRecord ? 200 : 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Attendance POST error:', error);
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

    const { id, status } = await request.json();
    
    if (!id || !status) {
      return new Response(JSON.stringify({ error: 'Attendance ID and status are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate status
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status. Must be: present, absent, late, or excused' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const attendance = await updateAttendance(id, status);
    
    if (!attendance) {
      return new Response(JSON.stringify({ error: 'Attendance record not found or update failed' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ attendance }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Attendance PUT error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
