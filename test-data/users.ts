// Test data alag file me, taake tests saaf rahen.
import { ENV } from '../config/env';

export const validUser = { email: ENV.email, password: ENV.password };

// Ye email app mein exist nahi karta (real account lock na ho, isliye negative tests isi se chalte hain)
export const unknownUser = { email: 'no.such.user.qa@theitzon.com', password: 'WrongPass#123' };
export const invalidUser = unknownUser;
export const malformedEmail = 'not-an-email';

// Galat format wali emails: form submit hi nahi hona chahiye
export const malformedEmails = [
  'plainaddress',
  '@theitzon.com',
  'user@',
  'user name@theitzon.com',
  'user@@theitzon.com',
];

// Security payloads (sirf unknown email ke saath, kabhi login nahi hona chahiye)
export const sqlInjection = "' OR '1'='1' --";
export const xssPayload = '<script>alert(1)</script>';

export const loginErrorText = 'Incorrect email or password';
