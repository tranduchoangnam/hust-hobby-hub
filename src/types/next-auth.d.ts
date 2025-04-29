import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Extending the built-in session types
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  /**
   * Extending the built-in JWT types
   */
  interface JWT {
    id: string;
  }
}