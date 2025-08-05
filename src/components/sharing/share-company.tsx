'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { supabase } from '@/lib/supabase'
import { 
  Mail, 
  Link as LinkIcon, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Share2, 
  Users, 
  Globe, 
  Lock,
  Send,
  ExternalLink,
  Sparkles
} from 'lucide-react'

interface ShareCompanyProps {
  companyId: string
  companyName: string
}

export default function ShareCompany({ companyId, companyName }: ShareCompanyProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [shareLinkLoading, setShareLinkLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  // Fonction simple pour afficher les messages
  const showMessage = (type: 'success' | 'error', message: string) => {
    alert(message)
  }

    const handleEmailShare = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      showMessage('error', 'Veuillez saisir une adresse email')
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        showMessage('error', 'Vous devez être connecté pour partager')
        return
      }

      const requestBody = {
        companyId,
        email: email.trim(),
        message: message.trim()
      }

      const response = await fetch('/api/share-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        showMessage('success', 'Invitation envoyée avec succès !')
        setEmail('')
        setMessage('')
        setIsOpen(false)
      } else {
        const error = await response.json()
        showMessage('error', error.message || 'Erreur lors de l\'envoi de l\'invitation')
      }
    } catch (error) {
      showMessage('error', 'Erreur lors de l\'envoi de l\'invitation')
    } finally {
      setLoading(false)
    }
  }

  const generateShareLink = async () => {
    setShareLinkLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
               if (!session?.access_token) {
           showMessage('error', 'Vous devez être connecté pour générer un lien')
           return
         }

      const response = await fetch('/api/generate-share-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ companyId })
      })

               if (response.ok) {
           const { shareUrl } = await response.json()
           setShareLink(shareUrl)
           showMessage('success', 'Lien de partage généré !')
         } else {
           showMessage('error', 'Erreur lors de la génération du lien')
         }
       } catch (error) {
         showMessage('error', 'Erreur lors de la génération du lien')
       } finally {
      setShareLinkLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!shareLink) return
    
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      showMessage('success', 'Lien copié dans le presse-papiers !')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      showMessage('error', 'Erreur lors de la copie')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header avec animation */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
              <Share2 className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Partager {companyName}
          </h2>
          <p className="text-muted-foreground mt-2">
            Invitez des collaborateurs ou générez un lien public
          </p>
        </div>
      </div>

      {/* Options de partage */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Partage par email */}
        <Card className="relative overflow-hidden border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-purple-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Recommandé
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Invitation par email</CardTitle>
                <CardDescription>
                  Envoyez une invitation personnalisée
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email du destinataire</label>
              <Input
                type="email"
                placeholder="collaborateur@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-2 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message (optionnel)</label>
              <Textarea
                placeholder="Bonjour, je vous invite à consulter les documents de cette entreprise..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="border-2 focus:border-blue-500"
              />
            </div>
                        <Button 
              onClick={handleEmailShare}
              disabled={loading || !email.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Envoi en cours...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Envoyer l'invitation
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Lien public */}
        <Card className="relative overflow-hidden border-2 hover:border-green-200 transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-emerald-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Public
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Lien public</CardTitle>
                <CardDescription>
                  Générer un lien accessible à tous
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Lock className="h-4 w-4" />
                Accès en lecture seule
              </div>
              <p className="text-sm">
                Le lien permettra de consulter les documents sans pouvoir les modifier.
              </p>
            </div>
            
            {shareLink ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono flex-1 truncate">{shareLink}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open(shareLink, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Tester le lien
                </Button>
              </div>
            ) : (
              <Button 
                onClick={generateShareLink}
                disabled={shareLinkLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                {shareLinkLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Génération...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Générer le lien
                  </div>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informations supplémentaires */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900">Comment ça marche ?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Invitation par email :</strong> L'utilisateur recevra un email avec un lien sécurisé</li>
                <li>• <strong>Lien public :</strong> Partageable avec n'importe qui, accès en lecture seule</li>
                <li>• <strong>Sécurité :</strong> Tous les accès sont tracés et peuvent être révoqués</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
