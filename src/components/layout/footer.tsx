import Link from 'next/link'
import { FiichLogo } from '@/components/ui/fiich-logo'

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0 px-4">
        {/* Logo et copyright */}
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <FiichLogo size="md" />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Fiich. Tous droits réservés.
          </p>
        </div>
        
        {/* Liens de navigation */}
        <div className="flex items-center space-x-6">
          <Link
            href="/legal/privacy"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Confidentialité
          </Link>
          <Link
            href="/legal/terms"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Conditions d'utilisation
          </Link>
          <Link
            href="/contact"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}