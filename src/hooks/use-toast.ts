// Hook simple pour les messages utilisateur
export function useToast() {
  const toast = {
    success: (message: string) => {
      console.log('✅ Succès:', message)
      alert(message)
    },
    error: (message: string) => {
      console.error('❌ Erreur:', message)
      alert(message)
    },
    info: (message: string) => {
      console.log('ℹ️ Info:', message)
      alert(message)
    }
  }

  return { toast }
} 