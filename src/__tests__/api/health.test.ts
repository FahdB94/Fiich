/**
 * Test de santé pour vérifier que l'application fonctionne correctement
 */

// Mock fetch pour les tests
global.fetch = jest.fn()

describe('Application Health Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Environment variables are loaded', () => {
    // Vérifier que les variables d'environnement essentielles sont présentes
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
  })

  test('Supabase configuration is valid', () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Vérifier que l'URL Supabase a le bon format
    if (supabaseUrl) {
      expect(supabaseUrl).toMatch(/^https:\/\/.*\.supabase\.co$/)
    }

    // Vérifier que la clé a le bon format (JWT)
    if (supabaseKey) {
      expect(supabaseKey).toMatch(/^eyJ/)
    }
  })

  test('Application configuration is complete', () => {
    // Vérifier la configuration des emails
    expect(process.env.SMTP_HOST).toBeDefined()
    expect(process.env.SMTP_PORT).toBeDefined()
    expect(process.env.SMTP_USER).toBeDefined()
    expect(process.env.FROM_EMAIL).toBeDefined()

    // Vérifier l'URL de l'application
    expect(process.env.NEXT_PUBLIC_APP_URL).toBeDefined()
  })
})

// Test de base pour les utilitaires
describe('Utility Functions', () => {
  test('Token generation works', async () => {
    const { generateShareToken, generateInvitationToken } = await import('@/lib/utils/tokens')
    
    const shareToken = generateShareToken()
    const invitationToken = generateInvitationToken()

    expect(shareToken).toBeDefined()
    expect(typeof shareToken).toBe('string')
    expect(shareToken.length).toBeGreaterThan(10)

    expect(invitationToken).toBeDefined()
    expect(typeof invitationToken).toBe('string')
    expect(invitationToken.length).toBeGreaterThan(10)

    // Vérifier que les tokens sont différents
    expect(shareToken).not.toBe(invitationToken)
  })
})

// Test de validation des schémas
describe('Validation Schemas', () => {
  test('Company schema validates correctly', async () => {
    const { companySchema } = await import('@/lib/validations')

    const validCompany = {
      company_name: 'Test Company',
      address_line_1: '123 Test Street',
      postal_code: '75001',
      city: 'Paris',
      country: 'France',
      email: 'test@company.com'
    }

    const result = companySchema.safeParse(validCompany)
    expect(result.success).toBe(true)

    // Test avec données invalides
    const invalidCompany = {
      company_name: '', // Requis
      email: 'invalid-email' // Format invalide
    }

    const invalidResult = companySchema.safeParse(invalidCompany)
    expect(invalidResult.success).toBe(false)
  })

  test('Auth schemas validate correctly', async () => {
    const { signUpSchema, signInSchema } = await import('@/lib/validations')

    // Test signup valide
    const validSignup = {
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      first_name: 'John',
      last_name: 'Doe'
    }

    const signupResult = signUpSchema.safeParse(validSignup)
    expect(signupResult.success).toBe(true)

    // Test signin valide
    const validSignin = {
      email: 'test@example.com',
      password: 'Password123'
    }

    const signinResult = signInSchema.safeParse(validSignin)
    expect(signinResult.success).toBe(true)
  })
})

export {}