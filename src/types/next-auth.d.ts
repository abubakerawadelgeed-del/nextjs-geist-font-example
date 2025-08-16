import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      companyId: string
      employeeId: string
      department: string
      position: string
      company: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    companyId: string
    employeeId: string
    department: string
    position: string
    company: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: string
    companyId: string
    employeeId: string
    department: string
    position: string
    company: string
  }
}
