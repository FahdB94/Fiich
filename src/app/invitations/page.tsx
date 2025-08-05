import { MainLayout } from '@/components/layout/main-layout'
import InvitationsList from '@/components/invitations/invitations-list'

export default function InvitationsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <InvitationsList />
      </div>
    </MainLayout>
  )
} 