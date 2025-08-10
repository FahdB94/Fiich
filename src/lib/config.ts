import { env } from '@/lib/env'

export const siteConfig = {
  name: "Fiich",
  description: "Professional business identity card sharing platform",
  url: env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  ogImage: `${env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/og.jpg`,
  creator: "Fiich Team",
  keywords: [
    "business",
    "identity",
    "enterprise",
    "document sharing",
    "professional",
    "secure sharing"
  ],
}

export const supabaseConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
}

export const appConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  supportedLanguages: ['fr', 'en'],
  defaultLanguage: 'fr',
}