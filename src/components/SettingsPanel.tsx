import type { FormSettings } from '../App'

interface SettingsPanelProps {
  settings: FormSettings
  onChange: (settings: FormSettings) => void
  running: boolean
  onRun: () => void
}

function SettingsPanel({ settings, onChange, running, onRun }: SettingsPanelProps) {
  const update = <Key extends keyof FormSettings>(key: Key, value: FormSettings[Key]) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <aside className="settings-panel">
      <div>
        <p className="step-label">Preferências</p>
        <h2>Como deve ser o plano?</h2>
      </div>

      <label className="field">
        <span>Próximo semestre</span>
        <input value={settings.startTerm} onChange={(event) => update('startTerm', event.target.value)} placeholder="2027.1" inputMode="decimal" />
      </label>
      <label className="field">
        <span>Carga máxima por semestre</span>
        <input type="number" min="240" max="720" step="30" value={settings.maxHours} onChange={(event) => update('maxHours', Number(event.target.value))} />
      </label>
      <label className="field">
        <span>Semestres considerados</span>
        <input type="number" min="2" max="30" value={settings.horizon} onChange={(event) => update('horizon', Number(event.target.value))} />
      </label>
      <label className="range-field">
        <span>Equilíbrio da carga <output>{settings.balanceWeight}</output></span>
        <input type="range" min="0" max="5" step="0.5" value={settings.balanceWeight} onChange={(event) => update('balanceWeight', Number(event.target.value))} />
        <small><span>formar mais rápido</span><span>carga mais uniforme</span></small>
      </label>
      <label className="check-field">
        <input type="checkbox" checked={settings.respectOffering} onChange={(event) => update('respectOffering', event.target.checked)} />
        <span>Respeitar o semestre de oferta das disciplinas</span>
      </label>

      <details>
        <summary>Ajustes do algoritmo</summary>
        <label className="field compact">
          <span>População</span>
          <input type="number" min="20" max="500" step="10" value={settings.populationSize} onChange={(event) => update('populationSize', Number(event.target.value))} />
        </label>
        <label className="field compact">
          <span>Gerações</span>
          <input type="number" min="50" max="2000" step="50" value={settings.maxGenerations} onChange={(event) => update('maxGenerations', Number(event.target.value))} />
        </label>
        <label className="field compact">
          <span>Taxa de mutação</span>
          <input type="number" min="0" max="0.5" step="0.01" value={settings.mutationRate} onChange={(event) => update('mutationRate', Number(event.target.value))} />
        </label>
      </details>

      <button className={`run-button${running ? ' is-running' : ''}`} type="button" onClick={onRun}>
        {running ? 'Parar otimização' : 'Montar meu plano'}
      </button>
    </aside>
  )
}

export default SettingsPanel
