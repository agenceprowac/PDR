'use client'

import { useStore } from '@/context/StoreContext'
import Link from 'next/link'

export default function Dashboard() {
  const { dossiers, isLoading, error } = useStore()

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h1>Tableau de Bord des Dossiers</h1>
        <Link href="/dossiers/nouveau" className="btn btn-primary">
          + Nouveau Dossier
        </Link>
      </div>

      <div className="glass-panel">
        {error && (
          <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '1rem' }}>
            <strong>Erreur de chargement:</strong> {error}
          </div>
        )}
        {isLoading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Chargement des dossiers en cours...</p>
        ) : dossiers.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Aucun dossier en cours. Créez-en un nouveau !</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '1rem' }}>Référence</th>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem' }}>Produits</th>
                <th style={{ padding: '1rem' }}>Devise</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dossiers.map(dossier => (
                <tr key={dossier.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{dossier.reference}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {new Date(dossier.date_creation).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '1rem' }}>{dossier.produits.length}</td>
                  <td style={{ padding: '1rem' }}>{dossier.devise}</td>
                  <td style={{ padding: '1rem' }}>
                    <Link href={`/dossiers/${dossier.id}`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
