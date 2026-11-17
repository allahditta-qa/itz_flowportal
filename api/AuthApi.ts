// API layer: app ke REST endpoints ka wrapper. UI ke bina tez setup aur API tests ke kaam aata hai.
// Login API: POST /api/auth/login  { email, password }  ->  200 + cookie "session_token"; galat details par 401 (ya 429 lockout).
import { APIRequestContext, APIResponse } from '@playwright/test';

// /api/auth/me ka jawab (sirf wo fields jo tests use karte hain)
export interface UserProfile {
  id: string | number;
  name: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

export class AuthApi {
  constructor(private readonly request: APIRequestContext) {}

  // baseURL playwright.config.ts se aata hai
  login(email: string, password: string): Promise<APIResponse> {
    return this.request.post('/api/auth/login', { data: { email, password } });
  }

  me(): Promise<APIResponse> {
    return this.request.get('/api/auth/me');
  }
}
