import { TOTAL_HOURS } from '../data/curriculum'
import type {
  Chromosome,
  Course,
  GenerationResult,
  GeneticSettings,
  PlanEvaluation,
  PlannerSettings,
} from './types'

const HARD_PENALTY = 1000
const SEMESTER_WEIGHT = 100
const EARLINESS_WEIGHT = 0.01

interface Problem extends PlannerSettings {
  courses: Course[]
  size: number
  prerequisites: number[][]
  corequisites: number[][]
  groups: number[][]
  groupOf: number[]
  completedHours: number
}

export function createSeededRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

export function buildProblem(
  curriculum: Course[],
  completedIds: ReadonlySet<string>,
  settings: PlannerSettings,
): Problem {
  const pending = curriculum.filter((item) => !completedIds.has(item.id))
  const indexById = new Map(pending.map((item, index) => [item.id, index]))
  const pendingIndexes = (ids: string[]) => ids.flatMap((id) => {
    const index = indexById.get(id)
    return index === undefined ? [] : [index]
  })

  const prerequisites = pending.map((item) => pendingIndexes(item.prerequisites))
  const corequisites = pending.map((item) => pendingIndexes(item.corequisites))
  const parent = pending.map((_, index) => index)
  const root = (index: number): number => parent[index] === index
    ? index
    : (parent[index] = root(parent[index]))

  corequisites.forEach((list, index) => {
    list.forEach((corequisite) => {
      parent[root(corequisite)] = root(index)
    })
  })

  const grouped = new Map<number, number[]>()
  pending.forEach((_, index) => {
    const key = root(index)
    grouped.set(key, [...(grouped.get(key) ?? []), index])
  })

  const groupEntries = [...grouped.entries()]
  const groupIndexByRoot = new Map(groupEntries.map(([key], index) => [key, index]))
  const completedHours = curriculum
    .filter((item) => completedIds.has(item.id))
    .reduce((total, item) => total + item.hours, 0)

  return {
    ...settings,
    courses: pending,
    size: pending.length,
    prerequisites,
    corequisites,
    groups: groupEntries.map(([, members]) => members),
    groupOf: pending.map((_, index) => groupIndexByRoot.get(root(index))!),
    completedHours,
  }
}

function isOffered(problem: Problem, courseIndex: number, semester: number) {
  const current = problem.courses[courseIndex]
  if (!problem.respectOffering || current.category === 'elective' || current.category === 'complementary') {
    return true
  }
  const term = ((problem.startTerm - 1 + semester) % 2) + 1
  return (current.period % 2 === 1) === (term === 1)
}

export function evaluatePlan(problem: Problem, genes: number[], explain = false): PlanEvaluation {
  const load = new Array(problem.horizon).fill(0) as number[]
  genes.forEach((semester, index) => {
    load[semester] += problem.courses[index].hours
  })

  let violations = 0
  const issues: PlanEvaluation['issues'] = []
  const report = (amount: number, courseIndex: number | null, message: string) => {
    violations += amount
    if (explain) issues.push({ courseIndex, message })
  }

  problem.courses.forEach((current, index) => {
    problem.prerequisites[index].forEach((prerequisite) => {
      if (genes[prerequisite] >= genes[index]) {
        report(1, index, `${current.name} aparece antes de ${problem.courses[prerequisite].name}.`)
      }
    })
    problem.corequisites[index].forEach((corequisite) => {
      if (corequisite > index && genes[corequisite] !== genes[index]) {
        report(1, index, `${current.name} e ${problem.courses[corequisite].name} precisam ficar juntos.`)
      }
    })
    if (!isOffered(problem, index, genes[index])) {
      report(1, index, `${current.name} não é oferecida nesse semestre.`)
    }
  })

  const hoursBefore: number[] = []
  let accumulated = problem.completedHours
  load.forEach((hours) => {
    hoursBefore.push(accumulated)
    accumulated += hours
  })

  genes.forEach((semester, index) => {
    const required = problem.courses[index].minimumProgress * TOTAL_HOURS
    if (required && hoursBefore[semester] < required) {
      report(1, index, `${problem.courses[index].name} exige ${Math.round(problem.courses[index].minimumProgress * 100)}% do curso concluído.`)
    }
  })

  let lastSemester = -1
  load.forEach((hours, semester) => {
    if (hours > 0) lastSemester = semester
    if (hours > problem.maxHours) {
      report((hours - problem.maxHours) / 30, null, `O semestre ${semester + 1} ultrapassa ${problem.maxHours}h.`)
    }
  })

  const semesters = lastSemester + 1
  const usedLoad = load.slice(0, semesters)
  const average = usedLoad.reduce((sum, hours) => sum + hours, 0) / Math.max(semesters, 1)
  const standardDeviation = Math.sqrt(
    usedLoad.reduce((sum, hours) => sum + (hours - average) ** 2, 0) / Math.max(semesters, 1),
  )
  const weightedFinish = genes.reduce(
    (total, semester, index) => total + semester * problem.courses[index].hours,
    0,
  )

  return {
    cost: HARD_PENALTY * violations
      + SEMESTER_WEIGHT * semesters
      + problem.balanceWeight * standardDeviation
      + EARLINESS_WEIGHT * weightedFinish,
    violations,
    semesters,
    load: usedLoad,
    standardDeviation,
    issues,
  }
}

export function decodeChromosome(problem: Problem, chromosome: Chromosome) {
  const capacity = Math.min(problem.maxHours, chromosome.targetLoad)
  const semesterOf = new Array(problem.size).fill(-1) as number[]
  const load = new Array(problem.horizon).fill(0) as number[]
  const placed = new Array(problem.groups.length).fill(false) as boolean[]
  let placedHours = problem.completedHours

  const groupHours = (group: number) => problem.groups[group]
    .reduce((total, index) => total + problem.courses[index].hours, 0)
  const requiredHours = (group: number) => Math.max(
    ...problem.groups[group].map((index) => problem.courses[index].minimumProgress * TOTAL_HOURS),
  )
  const isReady = (group: number) => problem.groups[group].every((index) =>
    problem.prerequisites[index].every((prerequisite) =>
      problem.groupOf[prerequisite] === group || semesterOf[prerequisite] >= 0,
    ),
  )
  const completedBefore = (semester: number) => problem.completedHours
    + load.slice(0, semester).reduce((total, hours) => total + hours, 0)

  for (let remaining = problem.groups.length; remaining > 0; remaining -= 1) {
    let chosen = -1
    let deferred = -1

    for (const courseIndex of chromosome.order) {
      const group = problem.groupOf[courseIndex]
      if (placed[group] || !isReady(group)) continue
      if (placedHours < requiredHours(group)) {
        if (deferred < 0) deferred = group
        continue
      }
      chosen = group
      break
    }

    if (chosen < 0) chosen = deferred
    if (chosen < 0) throw new Error('A grade possui um ciclo de pré-requisitos.')

    const members = problem.groups[chosen]
    const hours = groupHours(chosen)
    let semester = 0

    members.forEach((index) => {
      problem.prerequisites[index].forEach((prerequisite) => {
        if (problem.groupOf[prerequisite] !== chosen) {
          semester = Math.max(semester, semesterOf[prerequisite] + 1)
        }
      })
    })

    while (semester < problem.horizon - 1 && (
      load[semester] + hours > capacity
      || !members.every((index) => isOffered(problem, index, semester))
      || completedBefore(semester) < requiredHours(chosen)
    )) {
      semester += 1
    }

    members.forEach((index) => {
      semesterOf[index] = semester
    })
    load[semester] += hours
    placedHours += hours
    placed[chosen] = true
  }

  return semesterOf
}

function randomPermutation(size: number, random: () => number) {
  const order = Array.from({ length: size }, (_, index) => index)
  for (let index = size - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[order[index], order[target]] = [order[target], order[index]]
  }
  return order
}

function targetLoadRange(problem: Problem) {
  const biggestGroup = Math.max(...problem.groups.map((group) =>
    group.reduce((total, index) => total + problem.courses[index].hours, 0),
  ))
  return {
    min: Math.min(problem.maxHours, Math.max(240, biggestGroup)),
    max: problem.maxHours,
  }
}

function randomChromosome(problem: Problem, random: () => number): Chromosome {
  const { min, max } = targetLoadRange(problem)
  const steps = Math.floor((max - min) / 30)
  return {
    order: randomPermutation(problem.size, random),
    targetLoad: min + 30 * Math.floor(random() * (steps + 1)),
  }
}

function tournament(
  population: Chromosome[],
  costs: number[],
  size: number,
  random: () => number,
) {
  let best = Math.floor(random() * population.length)
  for (let index = 1; index < size; index += 1) {
    const challenger = Math.floor(random() * population.length)
    if (costs[challenger] < costs[best]) best = challenger
  }
  return population[best]
}

function crossover(first: Chromosome, second: Chromosome, random: () => number): Chromosome {
  const size = first.order.length
  let start = Math.floor(random() * size)
  let end = Math.floor(random() * size)
  if (start > end) [start, end] = [end, start]

  const order = new Array(size).fill(-1) as number[]
  const used = new Set<number>()
  for (let index = start; index <= end; index += 1) {
    order[index] = first.order[index]
    used.add(order[index])
  }

  let position = 0
  second.order.forEach((gene) => {
    if (used.has(gene)) return
    while (order[position] !== -1) position += 1
    order[position] = gene
  })

  return {
    order,
    targetLoad: random() < 0.5 ? first.targetLoad : second.targetLoad,
  }
}

function mutate(
  problem: Problem,
  chromosome: Chromosome,
  rate: number,
  random: () => number,
): Chromosome {
  const order = chromosome.order.slice()
  order.forEach((_, index) => {
    if (random() < rate) {
      const target = Math.floor(random() * order.length)
      ;[order[index], order[target]] = [order[target], order[index]]
    }
  })

  if (random() < 0.3) {
    const [gene] = order.splice(Math.floor(random() * order.length), 1)
    order.splice(Math.floor(random() * (order.length + 1)), 0, gene)
  }

  let targetLoad = chromosome.targetLoad
  if (random() < 0.2) {
    const { min, max } = targetLoadRange(problem)
    targetLoad = Math.min(max, Math.max(min, targetLoad + (random() < 0.5 ? -30 : 30)))
  }

  return { order, targetLoad }
}

export function createGeneticAlgorithm(
  problem: Problem,
  settings: GeneticSettings,
  random: () => number,
) {
  const fitness = (chromosome: Chromosome) => evaluatePlan(
    problem,
    decodeChromosome(problem, chromosome),
  ).cost
  let population = Array.from(
    { length: settings.populationSize },
    () => randomChromosome(problem, random),
  )
  let costs = population.map(fitness)
  let generation = 0

  return {
    step(): GenerationResult {
      const ranking = costs.map((_, index) => index).sort((a, b) => costs[a] - costs[b])
      const next = ranking.slice(0, settings.elitism).map((index) => population[index])

      while (next.length < settings.populationSize) {
        const first = tournament(population, costs, settings.tournamentSize, random)
        const second = tournament(population, costs, settings.tournamentSize, random)
        const child = random() < settings.crossoverRate
          ? crossover(first, second, random)
          : { order: first.order.slice(), targetLoad: first.targetLoad }
        next.push(mutate(problem, child, settings.mutationRate, random))
      }

      population = next
      costs = population.map(fitness)
      generation += 1
      const best = costs.reduce(
        (bestIndex, cost, index) => cost < costs[bestIndex] ? index : bestIndex,
        0,
      )

      return {
        generation,
        genes: decodeChromosome(problem, population[best]),
        cost: costs[best],
      }
    },
  }
}

export type { Problem }
