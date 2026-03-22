import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma, sql, ensureUserPermissionsColumn } from "@/lib/db"
import { permissionsForRole, sanitizePermissions } from "@/lib/permissions"
import type { AppPermission, UserRole } from "@/lib/types"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      permissions: AppPermission[]
    }
  }
  interface User {
    role: UserRole
    permissions: AppPermission[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole
    permissions?: AppPermission[]
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        try {
          await ensureUserPermissionsColumn()

          const user = await prisma.user.findUnique({
            where: { email }
          })

          if (!user) {
            return null
          }

          const isValid = await compare(password, user.password_hash)
          if (!isValid) {
            return null
          }

          const permissionRows = await sql(
            `SELECT permissions
             FROM users
             WHERE id = $1
             LIMIT 1`,
            [user.id]
          ) as { permissions: string[] | null }[]

          const dbPermissions = sanitizePermissions(permissionRows[0]?.permissions || [])
          const effectivePermissions = permissionsForRole(user.role, dbPermissions)

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: effectivePermissions,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.permissions = user.permissions
      }

      if (token.sub) {
        try {
          await ensureUserPermissionsColumn()
          const rows = await sql(
            `SELECT role, permissions
             FROM users
             WHERE id = $1
             LIMIT 1`,
            [Number(token.sub)]
          ) as { role: UserRole; permissions: string[] | null }[]

          if (rows.length > 0) {
            const dbRole = rows[0].role
            const dbPermissions = sanitizePermissions(rows[0].permissions || [])
            token.role = dbRole
            token.permissions = permissionsForRole(dbRole, dbPermissions)
          }
        } catch (error) {
          console.error("JWT sync error:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role ?? "CASHIER"
        session.user.permissions = permissionsForRole(
          session.user.role,
          sanitizePermissions(token.permissions || [])
        )

        if (token.sub) {
          try {
            await ensureUserPermissionsColumn()
            const rows = await sql(
              `SELECT role, permissions
               FROM users
               WHERE id = $1
               LIMIT 1`,
              [Number(token.sub)]
            ) as { role: UserRole; permissions: string[] | null }[]

            if (rows.length > 0) {
              const dbRole = rows[0].role
              const dbPermissions = sanitizePermissions(rows[0].permissions || [])
              session.user.role = dbRole
              session.user.permissions = permissionsForRole(dbRole, dbPermissions)
            }
          } catch (error) {
            console.error("Session sync error:", error)
          }
        }
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.AUTH_SECRET || "dev-secret-change-in-production-colegio-invisible-2024",
  trustHost: true
})
