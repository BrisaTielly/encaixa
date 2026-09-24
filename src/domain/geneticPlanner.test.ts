import { describe, expect, it } from 'vitest'
import { CURRICULUM, TOTAL_HOURS } from '../data/curriculum'
import {
  buildProblem,
  createGeneticAlgorithm,
  createSeededRandom,
  decodeChromosome,
  evaluatePlan,
} from './geneticPlanner'
import type { PlannerSettings } from './types'

const settings: PlannerSettings = {
  maxHours: 420,
  horizon: 14,
  respectOffering: true,
  startTerm: 1,
  balanceWeight: 1,
}

describe('curriculum', () => {
  it('keeps the expected number of courses and hours', () => {
    expect(CURRICULUM).toHaveLength(63)
    expect(CURRICULUM.reduce((total, item) => total + item.hours, 0)).toBe(TOTAL_HOURS)
  })

  it('only references existing courses', () => {
    const ids = new Set(CURRICULUM.map((item) => item.id))
    CURRICULUM.forEach((item) => {
      expect(item.prerequisites.every((id) => ids.has(id))).toBe(true)
      expect(item.corequisites.every((id) => ids.has(id))).toBe(true)
    })
  })
})

describe('planner', () => {
  it('places prerequisites before dependent courses', () => {
    const problem = buildProblem(CURRICULUM, new Set(), settings)
    const genes = decodeChromosome(problem, {
      order: Array.from({ length: problem.size }, (_, index) => index).reverse(),
      targetLoad: 420,
    })
    const cal1 = problem.courses.findIndex((item) => item.id === 'CAL1')
    const cal2 = problem.courses.findIndex((item) => item.id === 'CAL2')
    expect(genes[cal1]).toBeLessThan(genes[cal2])
  })

  it('keeps corequisites in the same semester', () => {
    const problem = buildProblem(CURRICULUM, new Set(), settings)
    const genes = decodeChromosome(problem, {
      order: Array.from({ length: problem.size }, (_, index) => index),
      targetLoad: 420,
    })
    const theory = problem.courses.findIndex((item) => item.id === 'ELDIG')
    const lab = problem.courses.findIndex((item) => item.id === 'LABELDIG')
    expect(genes[theory]).toBe(genes[lab])
  })

  it('repeats a run when the seed is the same', () => {
    const completed = new Set(CURRICULUM.filter((item) => item.period <= 6).map((item) => item.id))
    const problem = buildProblem(CURRICULUM, completed, settings)
    const run = () => {
      const algorithm = createGeneticAlgorithm(problem, {
        populationSize: 40,
        crossoverRate: 0.9,
        mutationRate: 0.06,
        elitism: 2,
        tournamentSize: 3,
      }, createSeededRandom(42))
      let result = algorithm.step()
      for (let generation = 1; generation < 30; generation += 1) result = algorithm.step()
      return result
    }
    const first = run()
    const second = run()
    expect(second.genes).toEqual(first.genes)
    expect(evaluatePlan(problem, first.genes).violations).toBe(0)
  })
})
