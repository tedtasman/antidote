import type { Cadence } from './cadence'
import type { TaxEffect } from './taxEffect'

type Amount = { kind: 'flat'; value: number } | { kind: 'percentOfGross'; value: number }

interface ExpenseBase {
  id: string
  name: string
  groupId: string
  taxEffects: TaxEffect[]
}

interface StandaloneExpense extends ExpenseBase {
  kind: 'standalone'
  cadence: Cadence
  amount: number
}

interface PaycheckExpense extends ExpenseBase {
  kind: 'paycheck'
  incomeId: string
  amount: Amount
}

export type Expense = StandaloneExpense | PaycheckExpense
