import { SignUpForm } from '@/components/auth/signup-form'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <SignUpForm />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'S\'inscrire | Fiich',
  description: 'Créez votre compte Fiich gratuitement',
}