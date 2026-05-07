import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { User } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export function createJWT(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      school_id: user.school_id,
      first_name: user.first_name,
      last_name: user.last_name
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getAuthFromCookie(cookies: any): any {
  const token = cookies.get('auth')?.value;
  if (!token) return null;
  return verifyJWT(token);
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
