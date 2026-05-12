import type { APIRoute } from 'astro';
import { getUsers } from '../../lib/db';
import { getAuthFromCookie } from '../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const auth = getAuthFromCookie(cookies);
  if (!auth || auth.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const users = await getUsers(auth.school_id);

    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API Error (users):', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
