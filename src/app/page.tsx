import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, FileText, Share2, Shield, CheckCircle, Users } from 'lucide-react'

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-animated opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-muted/30"></div>
        <div className="relative container px-4 py-24 mx-auto lg:py-32">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Partagez votre{' '}
                <span className="text-gradient">fiche entreprise</span>{' '}
                en toute sécurité
              </h1>
              <p className="max-w-3xl mx-auto text-xl text-muted-foreground leading-relaxed">
                Fiich vous permet de créer, stocker et partager votre identité d'entreprise 
                avec vos partenaires de manière professionnelle et sécurisée.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-lg px-8 btn-modern border-0">
                <Link href="/auth/signup">
                  Commencer gratuitement
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 glass hover:glass-dark/50" asChild>
                <Link href="/demo">
                  Voir la démo
                </Link>
              </Button>
            </div>

            <div className="mt-16">
              <div className="relative mx-auto max-w-4xl">
                <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl rounded-3xl"></div>
                <div className="relative glass rounded-2xl p-8 shadow-modern-lg border-2 border-primary/10">
                  <div className="text-center space-y-6">
                    <div className="inline-flex items-center space-x-2 gradient-accent text-white px-4 py-2 rounded-full text-sm font-medium shadow-modern">
                      <CheckCircle className="w-4 h-4" />
                      <span>Plateforme sécurisée</span>
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                      Votre fiche entreprise professionnelle
                    </h3>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                      Créez une présentation complète de votre entreprise avec tous vos documents 
                      légaux et partagez-la facilement avec vos partenaires.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 gradient-secondary opacity-50"></div>
        <div className="relative container px-4 mx-auto">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Tout ce dont vous avez{' '}
              <span className="text-gradient">besoin</span>
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground leading-relaxed">
              Une solution complète pour gérer et partager l'identité de votre entreprise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center glass border-primary/10 shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mx-auto gradient-primary w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-modern">
                  <Building className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Fiche entreprise complète</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Créez une fiche d'identité professionnelle avec toutes vos informations : 
                  SIREN, adresse, contact, description.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center glass border-primary/10 shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mx-auto gradient-accent w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-modern">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Documents sécurisés</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Stockez vos documents légaux (RIB, Kbis, CGV) en toute sécurité 
                  avec un accès contrôlé.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center glass border-primary/10 shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mx-auto gradient-primary w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-modern">
                  <Share2 className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Partage intelligent</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Partagez votre fiche avec des liens sécurisés et gérez 
                  les permissions de vos partenaires.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center glass border-primary/10 shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mx-auto gradient-accent w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-modern">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Sécurité avancée</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Authentification sécurisée, liens temporaires, 
                  et contrôle d'accès granulaire.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center glass border-primary/10 shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mx-auto gradient-primary w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-modern">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Gestion des invitations</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Invitez vos partenaires par email avec des accès 
                  personnalisés et temporaires.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center glass border-primary/10 shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mx-auto gradient-accent w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-modern">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Interface moderne</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Une expérience utilisateur fluide et professionnelle, 
                  responsive sur tous les appareils.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 gradient-animated opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-muted/20 to-background"></div>
        <div className="relative container px-4 mx-auto">
          <div className="text-center space-y-10">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Prêt à créer votre{' '}
                <span className="text-gradient">fiche entreprise</span> ?
              </h2>
              <p className="max-w-3xl mx-auto text-xl text-muted-foreground leading-relaxed">
                Rejoignez les entreprises qui font confiance à Fiich pour partager 
                leur identité professionnelle en toute sécurité.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-10 py-4 btn-modern border-0 text-white font-semibold">
                <Link href="/auth/signup">
                  Créer mon compte gratuit
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-10 py-4 glass hover:glass-dark/50 border-primary/20" asChild>
                <Link href="/contact">
                  Nous contacter
                </Link>
              </Button>
            </div>
            
            <div className="pt-8">
              <p className="text-sm text-muted-foreground">
                ✨ Aucune carte de crédit requise • 🚀 Configuration en 2 minutes • 🔒 Sécurisé et conforme RGPD
              </p>
            </div>
          </div>
    </div>
      </section>
    </MainLayout>
  )
}
