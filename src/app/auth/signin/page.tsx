import { SignInForm } from '@/components/auth/signin-form'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <SignInForm />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Se connecter | Fiich',
  description: 'Connectez-vous à votre compte Fiich',
}