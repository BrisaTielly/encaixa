export type CourseCategory = 'basic' | 'specific' | 'elective' | 'complementary'

export interface Course {
  id: string
  name: string
  period: number
  hours: number
  category: CourseCategory
  prerequisites: string[]
  corequisites: string[]
  minimumProgress: number
}

export interface PlannerSettings {
  maxHours: number
  horizon: number
  respectOffering: boolean
  startTerm: 1 | 2
  balanceWeight: number
}

export interface GeneticSettings {
  populationSize: number
  crossoverRate: number
  mutationRate: number
  elitism: number
  tournamentSize: number
}

export interface Chromosome {
  order: number[]
  targetLoad: number
}

export interface PlanIssue {
  courseIndex: number | null
  message: string
}

export interface PlanEvaluation {
  cost: number
  violations: number
  semesters: number
  load: number[]
  standardDeviation: number
  issues: PlanIssue[]
}

export interface GenerationResult {
  generation: number
  genes: number[]
  cost: number
}
