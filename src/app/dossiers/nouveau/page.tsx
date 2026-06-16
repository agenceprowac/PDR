'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore, Dossier } from '@/context/StoreContext'

export default function NouveauDossier() {
  const router = useRouter()
  const { addDossier } = useStore()

  const [reference, setReference] = useState('')
  const [devise, setDevise] = useState('EUR')
  const [tauxChange, setTauxChange] = useState('655.957')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newDossier = {
      reference: reference || `IMP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      date_creation: new Date().toISOString(),
      devise,
      taux_change: parseFloat(tauxChange) || 1,
      produits: [],
      frais: []
    }
    
    try {
      const newId = await addDossier(newDossier)
      router.push(`/dossiers/${newId}`)
    } catch (error) {
      console.error("Erreur lors de la création du dossier", error)
      alert("Une erreur est survenue lors de la création du dossier.")
    }
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2>Créer un Nouveau Dossier</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Initialisez les informations générales de l'importation.</p>
      </div>

      <div className="glass-panel">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Référence du Dossier</label>
            <input 
              type="text" 
              className="input-field" 
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="ex: IMPORT-CHINE-001"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Devise d'Achat (FOB)</label>
            <select 
              className="input-field"
              value={devise}
              onChange={(e) => setDevise(e.target.value)}
            >
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dollar (USD)</option>
              <option value="FCFA">Franc CFA (FCFA)</option>
              <option value="CNY">Yuan (CNY)</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Taux de Change vers Devise Locale (ex: FCFA)</label>
            <input 
              type="number" 
              step="0.001"
              className="input-field" 
              value={tauxChange}
              onChange={(e) => setTauxChange(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.push('/')}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Créer le Dossier
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
