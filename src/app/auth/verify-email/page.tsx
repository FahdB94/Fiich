import { VerifyEmailForm } from '@/components/auth/verify-email-form'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <VerifyEmailForm />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Vérifier votre email | Fiich',
  description: 'Vérifiez votre adresse email pour activer votre compte Fiich',
}