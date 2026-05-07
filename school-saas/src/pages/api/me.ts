import type { APIRoute } from 'astro';
import { getAuthFromCookie } from '../../lib/auth';
import { getUser, getClasses, getStudents } from '../../lib/db';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const auth = getAuthFromCookie(cookies);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get full user details
    const fullUser = await getUser(auth.email);
    if (!fullUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get role-specific data
    let additionalData: any = {};

    if (fullUser.role === 'teacher') {
      // Get teacher's classes
      additionalData.classes = await getClasses(fullUser.school_id, fullUser.id);
    } else if (fullUser.role === 'admin') {
      // Get school statistics
      const students = await getStudents(fullUser.school_id);
      const classes = await getClasses(fullUser.school_id);
      
      additionalData.stats = {
        totalStudents: students.length,
        totalClasses: classes.length,
        totalTeachers: classes.filter(c => c.teacher_id).length
      };
    } else if (fullUser.role === 'parent') {
      // In a real app, you'd get the parent's children from a relationships table
      // For now, we'll return empty array
      additionalData.children = [];
    }

    // Remove sensitive data
    const { password_hash, ...userWithoutPassword } = fullUser;

    return new Response(JSON.stringify({ 
      user: userWithoutPassword,
      ...additionalData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Me GET error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
