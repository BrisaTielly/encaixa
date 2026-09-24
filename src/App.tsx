import { useEffect, useMemo, useRef, useState } from 'react'
import CourseGrid from './components/CourseGrid'
import PlanResults from './components/PlanResults'
import SettingsPanel from './components/SettingsPanel'
import { CURRICULUM } from './data/curriculum'
import {
  buildProblem,
  createGeneticAlgorithm,
  createSeededRandom,
  evaluatePlan,
  type Problem,
} from './domain/geneticPlanner'
import type { PlanEvaluation } from './domain/types'

const STORAGE_KEY = 'encaixa-planner'

export interface FormSettings {
  startTerm: string
  maxHours: number
  horizon: number
  balanceWeight: number
  respectOffering: boolean
  populationSize: number
  maxGenerations: number
  mutationRate: number
}

export interface PlannerResult {
  problem: Problem
  genes: number[]
  evaluation: PlanEvaluation
  labels: string[]
  history: number[]
  generation: number
  message: string
}

const defaultSettings: FormSettings = {
  startTerm: '2027.1',
  maxHours: 420,
  horizon: 14,
  balanceWeight: 1,
  respectOffering: true,
  populationSize: 150,
  maxGenerations: 600,
  mutationRate: 0.06,
}

function loadSavedState(): { completed: string[]; settings: FormSettings } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    const validIds = new Set(CURRICULUM.map((item) => item.id))
    return {
      completed: Array.isArray(saved?.completed)
        ? saved.completed.filter((id: unknown): id is string => typeof id === 'string' && validIds.has(id))
        : [],
      settings: { ...defaultSettings, ...(saved?.settings ?? {}) },
    }
  } catch {
    return { completed: [], settings: defaultSettings }
  }
}

function parseStartTerm(value: string) {
  const match = value.trim().match(/^(\d{4})\.([12])$/)
  if (!match) return null
  return { year: Number(match[1]), term: Number(match[2]) as 1 | 2 }
}

function termLabel(start: { year: number; term: 1 | 2 }, semester: number) {
  const offset = start.term - 1 + semester
  return `${start.year + Math.floor(offset / 2)}.${(offset % 2) + 1}`
}

function App() {
  const saved = useMemo(loadSavedState, [])
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(saved.completed))
  const [settings, setSettings] = useState<FormSettings>(saved.settings)
  const [result, setResult] = useState<PlannerResult | null>(null)
  const [status, setStatus] = useState('Marque as disciplinas concluídas para começar.')
  const [running, setRunning] = useState(false)
  const runId = useRef(0)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: [...completed], settings }))
  }, [completed, settings])

  const toggleCourse = (id: string) => {
    setCompleted((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const togglePeriod = (period: number) => {
    const ids = CURRICULUM.filter((item) => item.period === period).map((item) => item.id)
    setCompleted((current) => {
      const next = new Set(current)
      const allCompleted = ids.every((id) => next.has(id))
      ids.forEach((id) => allCompleted ? next.delete(id) : next.add(id))
      return next
    })
  }

  const markUntil = (period: number) => {
    setCompleted(new Set(
      CURRICULUM.filter((item) => item.period <= period).map((item) => item.id),
    ))
  }

  const stopOptimization = () => {
    runId.current += 1
    setRunning(false)
    const message = 'Otimização interrompida. Mantivemos o melhor plano encontrado.'
    setStatus(message)
    setResult((current) => current ? { ...current, message } : current)
  }

  const startOptimization = () => {
    const start = parseStartTerm(settings.startTerm)
    if (!start) {
      setStatus('Informe o próximo semestre no formato 2027.1 ou 2027.2.')
      return
    }

    const problem = buildProblem(CURRICULUM, completed, {
      maxHours: Math.min(720, Math.max(240, settings.maxHours || 420)),
      horizon: Math.min(30, Math.max(2, settings.horizon || 14)),
      respectOffering: settings.respectOffering,
      startTerm: start.term,
      balanceWeight: Math.min(5, Math.max(0, settings.balanceWeight || 0)),
    })

    if (problem.size === 0) {
      setResult(null)
      setStatus('Todas as disciplinas estão concluídas. Hora de buscar o diploma.')
      return
    }

    const algorithm = createGeneticAlgorithm(problem, {
      populationSize: Math.min(500, Math.max(20, settings.populationSize || 150)),
      crossoverRate: 0.9,
      mutationRate: Math.min(0.5, Math.max(0, settings.mutationRate || 0)),
      elitism: 2,
      tournamentSize: 3,
    }, createSeededRandom(Date.now()))

    const currentRun = runId.current + 1
    runId.current = currentRun
    setRunning(true)
    setResult(null)
    setStatus('Procurando uma boa combinação...')

    let generation = 0
    let lastImprovement = 0
    let bestCost = Number.POSITIVE_INFINITY
    let bestGenes: number[] = []
    const history: number[] = []
    const maxGenerations = Math.min(2000, Math.max(50, settings.maxGenerations || 600))
    const stagnationLimit = Math.min(200, maxGenerations)

    const publishResult = (message: string) => {
      if (!bestGenes.length) return
      const evaluation = evaluatePlan(problem, bestGenes, true)
      const labels = evaluation.load.map((_, semester) => termLabel(start, semester))
      setResult({
        problem,
        genes: bestGenes,
        evaluation,
        labels,
        history: [...history],
        generation,
        message,
      })
    }

    const frame = () => {
      if (runId.current !== currentRun) return
      for (let batch = 0; batch < 8 && generation < maxGenerations; batch += 1) {
        const current = algorithm.step()
        generation = current.generation
        if (current.cost < bestCost) {
          bestCost = current.cost
          bestGenes = current.genes
          lastImprovement = generation
        }
        history.push(bestCost)
        if (generation - lastImprovement >= stagnationLimit) break
      }

      if (generation % 40 === 0) publishResult(`Analisando a geração ${generation}...`)

      const finished = generation >= maxGenerations
        || generation - lastImprovement >= stagnationLimit
      if (finished) {
        setRunning(false)
        publishResult(`Busca concluída após ${generation} gerações.`)
        return
      }
      requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Encaixa, início">encaixa</a>
        <a className="repo-link" href="https://github.com/BrisaTielly/encaixa" target="_blank" rel="noreferrer">
          Ver código
        </a>
      </header>

      <main id="top">
        <section className="hero">
          <p className="kicker">Planejador de graduação</p>
          <h1>Descubra o que ainda cabe até o diploma.</h1>
          <p>
            Marque o que você já concluiu. O algoritmo organiza as disciplinas
            restantes respeitando as principais regras da grade.
          </p>
        </section>

        <section className="workspace" aria-label="Planejador">
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            running={running}
            onRun={running ? stopOptimization : startOptimization}
          />
          <CourseGrid
            courses={CURRICULUM}
            completed={completed}
            onToggle={toggleCourse}
            onTogglePeriod={togglePeriod}
            onMarkUntil={markUntil}
            onClear={() => setCompleted(new Set())}
          />
        </section>

        <PlanResults result={result} status={result?.message ?? status} />
      </main>

      <footer>
        <p>Protótipo acadêmico. Confirme seu plano com a coordenação do curso.</p>
      </footer>
    </div>
  )
}

export default App
