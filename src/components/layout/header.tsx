'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Building, LogOut, Settings, User, Share2 } from 'lucide-react'
import { FiichLogo } from '@/components/ui/fiich-logo'
import { UnifiedNotificationBell } from '@/components/notifications/unified-notification-bell'

export function Header() {
  const { user, signOut, loading } = useAuth()

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center">
            <FiichLogo size="lg" className="hover:scale-105 transition-transform" />
          </Link>
        </div>

        {/* Navigation links for authenticated users */}
        {user && (
          <nav className="hidden md:flex items-center space-x-6">
                            <Link
                  href="/dashboard"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Tableau de bord
                </Link>
            <Link
              href="/my-company"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Ma Fiche
            </Link>
            <Link
              href="/shared-companies"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Fiches partagées
            </Link>
            <Link
              href="/active-shares"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Mes partages
            </Link>

          </nav>
        )}

        {/* User menu - always aligned to the right */}
        <div className="flex items-center space-x-2">
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <>
              <UnifiedNotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user.user_metadata?.avatar_url} 
                      alt={user.email || ''} 
                    />
                    <AvatarFallback>
                      {getInitials(user.email || '')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <Building className="mr-2 h-4 w-4" />
                      <span>Tableau de bord</span>
                    </Link>
                  </DropdownMenuItem>
                

                
                <DropdownMenuItem asChild>
                  <Link href="/shared-companies">
                    <Building className="mr-2 h-4 w-4" />
                    <span>Fiches partagées</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/active-shares">
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Mes partages</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(event) => {
                    event.preventDefault()
                    signOut()
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Se connecter</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">S'inscrire</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
