import { Cadence } from './cadence'

type IsoDate = string // YYYY-MM-DD
const isoDate = (date: Date): IsoDate => date.toISOString().slice(0, 10)

export interface PaySchedule {
  cadence: Cadence
  adjustments: Map<IsoDate, IsoDate>
}

export type LineRecurrence = { kind: 'everyPaycheck' } | { kind: 'cadence'; cadence: Cadence }

interface LineBase {
  id: string
  name: string
}

export interface HourlyLine extends LineBase {
  kind: 'hourly'
  hourlyRate: number
  hoursPerPaycheck: number
  recurrence: LineRecurrence
}

// Spread over every paycheck
export interface SalaryLine extends LineBase {
  kind: 'salary'
  salaryPerPaycheck: number
}

// Bonuses, commissions, etc...
export interface FixedLine extends LineBase {
  kind: 'fixed'
  amount: number
  recurrence: LineRecurrence
}

export type IncomeLine = HourlyLine | SalaryLine | FixedLine

export interface Income {
  id: string
  name: string
  taxRouteIds: Set<string>
  schedule: PaySchedule
  lines: Record<string, IncomeLine>
}

export interface Paycheck {
  incomeId: string
  cadence: Cadence
  regularDate: Date
  trueDate: Date // after adjustments
  lines: { lineId: string; amount: number }[]
  gross: number
}

function perAppearance(line: IncomeLine): number {
  switch (line.kind) {
    case 'hourly':
      return line.hourlyRate * line.hoursPerPaycheck
    case 'salary':
      return line.salaryPerPaycheck
    case 'fixed':
      return line.amount
  }
}

const recurrenceOf = (line: IncomeLine): LineRecurrence =>
  line.kind === 'salary' ? { kind: 'everyPaycheck' } : line.recurrence

function appearances(recurrence: LineRecurrence, payDate: Date, cadence: Cadence): number {
  const from = payDate
  const to = cadence.after(from)
  switch (recurrence.kind) {
    case 'everyPaycheck':
      return 1
    case 'cadence':
      return recurrence.cadence.numOccurrencesBetween(from, to)
  }
}

// Get all paychecks for a given income between two dates, [from, to)
export function paychecksBetween(income: Income, from: Date, to: Date): Paycheck[] {
  const { cadence, adjustments } = income.schedule
  // one extra one either end in case of adjustments, plus another for non-inclusive `to` date
  const occurrences = cadence.occurrencesBetween(cadence.before(from), cadence.nAfter(to, 2))
  // flatMap occurrences to filter out paychecks outside of the range
  return occurrences.flatMap((regularDate) => {
    const adjustedDate = adjustments.get(isoDate(regularDate))
    const trueDate = adjustedDate ? new Date(adjustedDate) : regularDate
    // filter out paychecks outside of the range
    if (trueDate < from || trueDate >= to) {
      return []
    }
    // flatMap lines to filter out lines with zero amount in this paycheck
    const lines = Object.values(income.lines).flatMap((line) => {
      // calculate amount on regularDate instead of trueDate; lines follow when pay is earned, not when it is paid
      const amount = perAppearance(line) * appearances(recurrenceOf(line), regularDate, cadence)
      // filter out lines with zero amount
      if (amount === 0) {
        return []
      }
      // construct the paycheck line object
      return {
        lineId: line.id,
        amount: amount,
      }
    })
    const gross = lines.reduce((sum, l) => sum + l.amount, 0)
    return { incomeId: income.id, cadence, regularDate, trueDate, lines, gross }
  })
}
