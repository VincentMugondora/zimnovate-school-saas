import type { APIRoute } from 'astro';
import { createJWT, verifyJWT, getAuthFromCookie, comparePassword, hashPassword } from '../../lib/auth';
import { getUser, createUser } from '../../lib/db';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password, action } = await request.json();

    if (action === 'login') {
      // Login
      const user = await getUser(email);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // In production, you'd compare hashed passwords
      // For now, we'll do a simple comparison
      const isValid = await comparePassword(password, user.password_hash || '');
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const token = createJWT(user);
      cookies.set('auth', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 // 24 hours
      });

      return new Response(JSON.stringify({ 
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          school_id: user.school_id
        }, 
        token 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (action === 'register') {
      // Register
      const { first_name, last_name, role, school_id } = await request.json();
      
      // Check if user already exists
      const existingUser = await getUser(email);
      if (existingUser) {
        return new Response(JSON.stringify({ error: 'User already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Hash password
      const password_hash = await hashPassword(password);

      const newUser = await createUser({
        email,
        password_hash,
        first_name,
        last_name,
        role,
        school_id
      });

      if (!newUser) {
        return new Response(JSON.stringify({ error: 'Failed to create user' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const token = createJWT(newUser);
      cookies.set('auth', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60
      });

      return new Response(JSON.stringify({ 
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          school_id: newUser.school_id
        }, 
        token 
      }), { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const GET: APIRoute = async ({ cookies }) => {
  const auth = getAuthFromCookie(cookies);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ user: auth }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete('auth');
  return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
