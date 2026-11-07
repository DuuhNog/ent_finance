import type { Database } from './database.types'

export type Household = Database['public']['Tables']['households']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type RecurringBill =
  Database['public']['Tables']['recurring_bills']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']

export type CategoryKind = 'expense' | 'income'
export type PaymentMethod = 'credit_card' | 'pix' | 'debit' | 'cash' | 'boleto'
export type GoalKind =
  'credit_card_limit' | 'category_limit' | 'monthly_savings'

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'credit_card', label: 'Cartão de crédito' },
  { value: 'pix', label: 'Pix' },
  { value: 'debit', label: 'Débito' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'boleto', label: 'Boleto' },
]
