import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Mot de passe oublié | Fiich',
  description: 'Réinitialisez votre mot de passe Fiich',
}