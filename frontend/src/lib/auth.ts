import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  profilePicture?: string;
  preferences: {
    language: 'en' | 'ur' | 'both';
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: User;
  token: string;
}

export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('healthmate_token')?.value;
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    // In a real app, you would fetch user data from the database
    // For now, we'll return a mock user
    const user: User = {
      _id: decoded.userId,
      name: 'John Doe',
      email: 'john@example.com',
      preferences: {
        language: 'both',
        notifications: true,
        theme: 'light',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return {
      user,
      token,
    };
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

export function requireAuth(redirectTo = '/auth/login') {
  return async function withAuth() {
    const session = await getServerSession();
    
    if (!session) {
      redirect(redirectTo);
    }
    
    return session;
  };
}
