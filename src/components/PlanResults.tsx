import { useState } from 'react'
import type { PlannerResult } from '../App'

interface PlanResultsProps {
  result: PlannerResult | null
  status: string
}

function ConvergenceChart({ history }: { history: number[] }) {
  if (history.length < 2) return null
  const width = 480
  const height = 120
  const values = history.map((value) => Math.log10(Math.max(value, 1)))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = values.map((value, index) => {
    const x = index / (values.length - 1) * width
    const y = 8 + (1 - (value - min) / range) * (height - 16)
    return `${x},${y}`
  }).join(' ')

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução do melhor custo ao longo das gerações">
        <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption>Melhor custo por geração</figcaption>
    </figure>
  )
}

function PlanResults({ result, status }: PlanResultsProps) {
  const [copied, setCopied] = useState(false)

  const copyPlan = async () => {
    if (!result) return
    const text = result.labels.map((label, semester) => {
      const names = result.genes.flatMap((assignedSemester, courseIndex) =>
        assignedSemester === semester ? [result.problem.courses[courseIndex].name] : [],
      )
      return `${label} (${result.evaluation.load[semester]}h): ${names.join('; ')}`
    }).join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <section className="results-section" aria-live="polite">
      <div className="results-heading">
        <div><p className="step-label">Resultado</p><h2>Uma rota possível</h2></div>
        {result && <button className="copy-button" type="button" onClick={copyPlan}>{copied ? 'Plano copiado' : 'Copiar plano'}</button>}
      </div>

      <p className={`result-status${result?.evaluation.violations ? ' has-issues' : ''}`}>{status}</p>

      {!result ? (
        <div className="empty-result"><span>O plano aparece aqui depois da otimização.</span></div>
      ) : (
        <>
          <div className="result-overview">
            <dl className="result-stats">
              <div><dt>Semestres</dt><dd>{result.evaluation.semesters}</dd></div>
              <div><dt>Conclusão</dt><dd>{result.labels.at(-1)}</dd></div>
              <div><dt>Violações</dt><dd>{Math.round(result.evaluation.violations * 10) / 10}</dd></div>
              <div><dt>Geração</dt><dd>{result.generation}</dd></div>
            </dl>
            <ConvergenceChart history={result.history} />
          </div>

          {result.evaluation.issues.length > 0 && (
            <div className="issues-box">
              <h3>O plano ainda tem conflitos</h3>
              <ul>{result.evaluation.issues.slice(0, 8).map((issue, index) => <li key={`${issue.message}-${index}`}>{issue.message}</li>)}</ul>
            </div>
          )}

          <div className="semester-grid">
            {result.labels.map((label, semester) => {
              const affected = new Set(result.evaluation.issues.map((issue) => issue.courseIndex))
              const assigned = result.genes.flatMap((assignedSemester, courseIndex) =>
                assignedSemester === semester ? [{ courseIndex, course: result.problem.courses[courseIndex] }] : [],
              )
              return (
                <article className="semester-card" key={label}>
                  <header><h3>{label}</h3><span>{result.evaluation.load[semester]}h</span></header>
                  <div className="semester-courses">
                    {assigned.map(({ course, courseIndex }) => (
                      <div className={`planned-course course-${course.category}${affected.has(courseIndex) ? ' has-issue' : ''}`} key={course.id}>
                        <span>{course.name}</span><small>{course.hours}h</small>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

export default PlanResults
