'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { signInSchema, SignInData } from '@/lib/validations'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInData) => {
    setIsLoading(true)

    try {
      const { data: authData, error } = await signIn(data.email, data.password)

      if (error) {
        toast.error('Erreur de connexion: ' + error.message)
        return
      }

      if (authData.user) {
        toast.success('Connexion réussie')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('Erreur inattendue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Se connecter</CardTitle>
        <CardDescription className="text-center">
          Connectez-vous à votre compte Fiich
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Se connecter
          </Button>
          
          <div className="text-center text-sm">
            <Link
              href="/auth/forgot-password"
              className="text-muted-foreground underline underline-offset-4 hover:text-primary"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Pas encore de compte ? </span>
            <Link
              href="/auth/signup"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              S'inscrire
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}