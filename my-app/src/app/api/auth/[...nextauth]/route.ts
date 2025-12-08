import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === "google") {
        try {
          // Check if this Google account is linked to an employee
          const result = await pool.query(
            'SELECT id, name, email, position, google_user_id FROM employees WHERE google_user_id = $1',
            [user.id]
          );

          if (result.rows.length > 0) {
            // Employee found with this Google ID
            user.employeeData = result.rows[0];
            return true;
          }

          // Also check by email in case they haven't linked their Google account yet
          const emailResult = await pool.query(
            'SELECT id, name, email, position, google_user_id FROM employees WHERE email = $1',
            [user.email]
          );

          if (emailResult.rows.length > 0) {
            const employee = emailResult.rows[0];
            
            // Link the Google account to this employee
            if (!employee.google_user_id) {
              await pool.query(
                'UPDATE employees SET google_user_id = $1 WHERE id = $2',
                [user.id, employee.id]
              );
            }
            
            user.employeeData = employee;
            return true;
          }

          // Not an employee - allow sign in for customers
          return true;
        } catch (error) {
          console.error('Error checking employee status:', error);
          return true; // Allow sign in anyway
        }
      }
      return true;
    },
    async session({ session, token }: any) {
      if (token.employeeData) {
        session.employee = token.employeeData;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user?.employeeData) {
        token.employeeData = user.employeeData;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
