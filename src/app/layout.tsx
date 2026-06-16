import type { Metadata } from 'next'
import './globals.css'
import { StoreProvider } from '@/context/StoreContext'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PDR SaaS - Calcul de Prix de Revient',
  description: 'Application de calcul de prix de revient pour importateurs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <div className="layout-container">
          <aside className="sidebar">
            <div>
              <h2 style={{ color: 'var(--accent-primary)' }}>PDR SaaS</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Calcul de Prix de Revient</p>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="/" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                📁 Mes Dossiers
              </a>
              <Link href="/parametres" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                ⚙️ Paramètres
              </Link>
            </nav>
          </aside>
          <main className="main-content">
            <StoreProvider>
              {children}
            </StoreProvider>
          </main>
        </div>
      </body>
    </html>
  )
}
