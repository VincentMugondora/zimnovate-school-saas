import type { APIRoute } from 'astro';
import { getClasses } from '../../lib/db';
import { getAuthFromCookie } from '../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  const auth = getAuthFromCookie(cookies);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const teacherId = url.searchParams.get('teacherId');
    const schoolId = auth.school_id;

    // Handle school_id being "null" or missing
    if (!schoolId || schoolId === 'null') {
       // If no school_id, we can't fetch classes. 
       // For now, return empty array instead of crashing.
       return new Response(JSON.stringify({ classes: [] }), {
         status: 200,
         headers: { 'Content-Type': 'application/json' }
       });
    }

    const classes = await getClasses(schoolId, teacherId || undefined);
    
    return new Response(JSON.stringify({ classes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API Error (classes):', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
