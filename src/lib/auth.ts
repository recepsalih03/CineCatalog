import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

export interface AdminCredentials {
  username: string;
  password: string;
}

export async function validateAdminCredentials(credentials: AdminCredentials): Promise<boolean> {
  const { username, password } = credentials;
  
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminUsername || !adminPassword) {
    console.error('Admin credentials not configured');
    return false;
  }
  
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return false;
  }
  
  const cleanUsername = username.trim().toLowerCase();
  const cleanAdminUsername = adminUsername.trim().toLowerCase();
  
  if (cleanUsername !== cleanAdminUsername) {
    return false;
  }
  
  const cleanPassword = password.trim();
  const cleanAdminPassword = adminPassword.trim();
  
  return cleanPassword === cleanAdminPassword;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function hashWithSHA256(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
}

export function encryptData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

export function decryptData(encryptedData: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}