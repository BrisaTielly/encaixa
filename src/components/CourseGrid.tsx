import { COURSE_CATEGORY_LABELS, TOTAL_HOURS } from '../data/curriculum'
import type { Course } from '../domain/types'

interface CourseGridProps {
  courses: Course[]
  completed: Set<string>
  onToggle: (id: string) => void
  onTogglePeriod: (period: number) => void
  onMarkUntil: (period: number) => void
  onClear: () => void
}

function CourseGrid({ courses, completed, onToggle, onTogglePeriod, onMarkUntil, onClear }: CourseGridProps) {
  const completedHours = courses
    .filter((item) => completed.has(item.id))
    .reduce((total, item) => total + item.hours, 0)
  const courseMap = new Map(courses.map((item) => [item.id, item]))
  const courseTitle = (item: Course) => {
    const details = [`${item.name}, ${item.hours}h`]
    if (item.prerequisites.length) {
      details.push(`Pré-requisitos: ${item.prerequisites.map((id) => courseMap.get(id)?.name).join(', ')}`)
    }
    if (item.corequisites.length) {
      details.push(`Cursar junto com: ${item.corequisites.map((id) => courseMap.get(id)?.name).join(', ')}`)
    }
    return details.join('\n')
  }

  return (
    <section className="courses-section">
      <div className="section-heading">
        <div>
          <p className="step-label">Disciplinas concluídas</p>
          <h2>O que você já pagou?</h2>
        </div>
        <div className="course-actions">
          <label>
            <span className="sr-only">Marcar disciplinas até o período</span>
            <select defaultValue="" onChange={(event) => {
              if (event.target.value) onMarkUntil(Number(event.target.value))
              event.target.value = ''
            }}>
              <option value="">Marcar até...</option>
              {Array.from({ length: 10 }, (_, index) => (
                <option key={index + 1} value={index + 1}>{index + 1}º período</option>
              ))}
            </select>
          </label>
          <button className="text-button" type="button" onClick={onClear}>Limpar</button>
        </div>
      </div>

      <p className="completion-summary">
        <strong>{completed.size}</strong> de {courses.length} disciplinas
        <span>{completedHours}h de {TOTAL_HOURS}h</span>
      </p>

      <div className="curriculum-scroll">
        <div className="curriculum-grid">
          {Array.from({ length: 10 }, (_, periodIndex) => {
            const period = periodIndex + 1
            return (
              <div className="period-column" key={period}>
                <button className="period-button" type="button" onClick={() => onTogglePeriod(period)}>
                  {period}º período
                </button>
                {courses.filter((item) => item.period === period).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`course-card course-${item.category}`}
                    aria-pressed={completed.has(item.id)}
                    title={courseTitle(item)}
                    onClick={() => onToggle(item.id)}
                  >
                    <span>{item.name}</span>
                    <small>{item.hours}h</small>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <div className="legend" aria-label="Legenda de disciplinas">
        {Object.entries(COURSE_CATEGORY_LABELS).map(([category, label]) => (
          <span key={category}><i className={`legend-${category}`} />{label}</span>
        ))}
      </div>
    </section>
  )
}

export default CourseGrid
