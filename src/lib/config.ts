export const siteConfig = {
  name: "Fiich",
  description: "Professional business identity card sharing platform",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  ogImage: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/og.jpg`,
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
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
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