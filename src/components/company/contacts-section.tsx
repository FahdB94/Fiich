'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus, User, Phone, Mail, Building } from 'lucide-react'
import { CompanyContactFormData } from '@/lib/types'

interface ContactsSectionProps {
  contacts: CompanyContactFormData[]
  onChange: (contacts: CompanyContactFormData[]) => void
  disabled?: boolean
}

const CONTACT_TYPES = [
  { value: 'commercial', label: 'Commercial', icon: User },
  { value: 'comptable', label: 'Comptable', icon: Building },
  { value: 'technique', label: 'Technique', icon: User },
  { value: 'administratif', label: 'Administratif', icon: User },
  { value: 'direction', label: 'Direction', icon: User },
  { value: 'autre', label: 'Autre', icon: User },
]

export function ContactsSection({ contacts = [], onChange, disabled = false }: ContactsSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContact, setNewContact] = useState<CompanyContactFormData>({
    contact_type: '',
    name: '',
    email: '',
    phone: '',
    job_title: '',
    notes: '',
  })

  const addContact = () => {
    if (newContact.contact_type && newContact.name) {
      onChange([...contacts, { ...newContact }])
      setNewContact({
        contact_type: '',
        name: '',
        email: '',
        phone: '',
        job_title: '',
        notes: '',
      })
      setShowAddForm(false)
    }
  }

  const removeContact = (index: number) => {
    onChange(contacts.filter((_, i) => i !== index))
  }

  const updateContact = (index: number, field: keyof CompanyContactFormData, value: string) => {
    const updatedContacts = [...contacts]
    updatedContacts[index] = { ...updatedContacts[index], [field]: value }
    onChange(updatedContacts)
  }

  const getContactTypeIcon = (type: string) => {
    const contactType = CONTACT_TYPES.find(t => t.value === type)
    return contactType ? contactType.icon : User
  }

  const getContactTypeLabel = (type: string) => {
    const contactType = CONTACT_TYPES.find(t => t.value === type)
    return contactType ? contactType.label : type
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-medium">Contacts</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un contact
        </Button>
      </div>

      {/* Liste des contacts existants */}
      {contacts.length > 0 && (
        <div className="space-y-3">
          {contacts.map((contact, index) => {
            const IconComponent = getContactTypeIcon(contact.contact_type)
            return (
              <Card key={index} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">
                        {getContactTypeLabel(contact.contact_type)}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContact(index)}
                      disabled={disabled}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardTitle className="text-base">{contact.name}</CardTitle>
                  {contact.job_title && (
                    <p className="text-sm text-muted-foreground">{contact.job_title}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                  </div>
                  {contact.notes && (
                    <div className="mt-3 p-2 bg-muted rounded text-sm">
                      {contact.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nouveau contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-type">Type de contact *</Label>
                <Select
                  value={newContact.contact_type}
                  onValueChange={(value) => setNewContact({ ...newContact, contact_type: value })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-name">Nom *</Label>
                <Input
                  id="contact-name"
                  placeholder="Nom du contact"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="email@exemple.com"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  disabled={disabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Téléphone</Label>
                <Input
                  id="contact-phone"
                  placeholder="01 23 45 67 89"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-job-title">Poste</Label>
              <Input
                id="contact-job-title"
                placeholder="Directeur commercial, Comptable..."
                value={newContact.job_title}
                onChange={(e) => setNewContact({ ...newContact, job_title: e.target.value })}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-notes">Notes</Label>
              <Textarea
                id="contact-notes"
                placeholder="Informations supplémentaires..."
                value={newContact.notes}
                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                disabled={disabled}
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={addContact}
                disabled={disabled || !newContact.contact_type || !newContact.name}
              >
                Ajouter le contact
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={disabled}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {contacts.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun contact ajouté</p>
          <p className="text-sm">Ajoutez des contacts pour votre entreprise</p>
        </div>
      )}
    </div>
  )
} 