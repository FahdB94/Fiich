'use client'

import React from 'react'
import { ErrorFallback } from './error-fallback'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error: Error
    resetErrorBoundary: () => void
    context?: string
  }>
  context?: string
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error)
    console.error('Error info:', errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Appeler le callback d'erreur si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // En production, on pourrait envoyer l'erreur à un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      // Exemple: Sentry.captureException(error)
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
          context={this.props.context}
        />
      )
    }

    return this.props.children
  }
}

// Hook pour créer facilement un ErrorBoundary avec des options
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: {
    fallback?: React.ComponentType<{
      error: Error
      resetErrorBoundary: () => void
      context?: string
    }>
    context?: string
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  }
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Error boundary spécialisé pour les formulaires
export function FormErrorBoundary({ 
  children, 
  onError 
}: { 
  children: React.ReactNode
  onError?: (error: Error) => void 
}) {
  return (
    <ErrorBoundary
      context="Formulaire"
      onError={(error, errorInfo) => {
        console.error('Form error:', error)
        onError?.(error)
      }}
      fallback={({ error, resetErrorBoundary }) => (
        <div className="p-6 text-center border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Erreur dans le formulaire
          </h3>
          <p className="text-red-600 mb-4">
            {error.message || 'Une erreur est survenue lors du traitement du formulaire'}
          </p>
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Réinitialiser le formulaire
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

// Error boundary pour les routes
export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      context="Navigation"
      fallback={({ error, resetErrorBoundary }) => (
        <div className="min-h-screen flex items-center justify-center">
          <ErrorFallback 
            error={error}
            resetErrorBoundary={resetErrorBoundary}
            context="Page"
          />
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}