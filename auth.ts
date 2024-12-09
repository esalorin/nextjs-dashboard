import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import Google from "next-auth/providers/google"
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';

async function getUser(email: string): Promise<User | undefined> {
	try {
    console.log('get user');
	  const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
	  return user.rows[0];
	} catch (error) {
	  console.error('Failed to fetch user:', error);
	  throw new Error('Failed to fetch user.');
	}
  }

  // async function createUser(name: string, email: string): Promise<User> {
  //   try {
  //     const newUser = await sql<User>`
  //       INSERT INTO users (name, email)
  //       VALUES (${name}, ${email})
  //       RETURNING *;
  //     `;
  //     return newUser.rows[0];
  //   } catch (error) {
  //     console.error('Failed to create user:', error);
  //     throw new Error('Failed to create user.');
  //   }
  // }
 
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [Credentials({
	async authorize(credentials) {
    console.log('check')
	  const parsedCredentials = z
		.object({ email: z.string().email(), password: z.string().min(6) })
		.safeParse(credentials);
		if (parsedCredentials.success) {
			const { email, password } = parsedCredentials.data;
			const user = await getUser(email);
			if (!user) return null;
			const passwordsMatch = await bcrypt.compare(password, user.password);
 
        	if (passwordsMatch) return user;
		}
		console.log('Invalid credentials');
    return null;
	}})]
});