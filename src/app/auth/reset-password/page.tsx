import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Réinitialiser le mot de passe | Fiich',
  description: 'Choisissez un nouveau mot de passe pour votre compte Fiich',
}