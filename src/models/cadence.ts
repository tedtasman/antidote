const MS_PER_DAY = 24 * 60 * 60 * 1000

export class Cadence {
  constructor(
    readonly days: number,
    readonly anchorDate: Date,
  ) {}

  // get the number of milliseconds for one step of this cadence
  private getTime(): number {
    return this.days * 86_400_000
  }

  // get the number of occurrences of this cadence before a given date
  private countBefore(t: Date): number {
    const elapsed = t.getTime() - this.anchorDate.getTime()
    return elapsed <= 0 ? 0 : Math.ceil(elapsed / this.getTime())
  }

  // get the kth occurrence of this cadence (0-indexed)
  private occurrenceAt(k: number): Date {
    return new Date(this.anchorDate.getTime() + k * this.getTime())
  }

  // get the number of occurrences per year for a given cadence
  perYear(): number {
    return Math.round(365 / this.days)
  }

  // advance a date by one step of this cadence
  after(referenceDate: Date): Date {
    return new Date(referenceDate.getTime() + this.getTime())
  }

  // advance a date by n steps of this cadence
  nAfter(referenceDate: Date, steps: number): Date {
    return new Date(referenceDate.getTime() + steps * this.getTime())
  }

  // go back a date by one step of this cadence
  before(referenceDate: Date): Date {
    return new Date(referenceDate.getTime() - this.getTime())
  }

  nBefore(referenceDate: Date, steps: number): Date {
    return new Date(referenceDate.getTime() - steps * this.getTime())
  }

  // get the number of occurrences of this cadence between two dates, [from, to)
  numOccurrencesBetween(from: Date, to: Date): number {
    return Math.max(0, this.countBefore(to) - this.countBefore(from))
  }

  // get all occurrences of this cadence between two dates, [from, to)
  occurrencesBetween(from: Date, to: Date): Date[] {
    const occurrences: Date[] = []
    for (let k = this.countBefore(from); k < this.countBefore(to); k++) {
      occurrences.push(this.occurrenceAt(k))
    }
    return occurrences
  }
}
