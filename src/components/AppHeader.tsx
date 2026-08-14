import { FileCheck2, ShieldCheck } from 'lucide-react'

interface AppHeaderProps {
  statusLabel: string
}

export function AppHeader({ statusLabel }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand" aria-label="PaperSteps">
        <span className="brand-mark"><FileCheck2 size={21} /></span>
        <span>PaperSteps</span>
      </div>
      <div className="privacy-status" title="PaperSteps does not upload your PDF">
        <ShieldCheck size={16} />
        <span>{statusLabel}</span>
      </div>
    </header>
  )
}
