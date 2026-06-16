'use client'

import { useState, useEffect } from 'react'
import { useStore, DynamicField } from '@/context/StoreContext'

export default function Parametres() {
  const { dynamicFields, addDynamicField } = useStore()
  
  // Entreprise state
  const [nom, setNom] = useState('')
  const [rccm, setRccm] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  
  const [isSavedInfo, setIsSavedInfo] = useState(false)
  
  // Nouveau champ dynamique state
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldMethod, setNewFieldMethod] = useState<'poids'|'valeur'|'quantite'>('valeur')
  const [isSavedField, setIsSavedField] = useState(false)

  useEffect(() => {
    // Load from local storage
    if (typeof window !== 'undefined') {
      setNom(localStorage.getItem('company_name') || '')
      setRccm(localStorage.getItem('company_rccm') || '')
      setLogo(localStorage.getItem('company_logo') || null)
    }
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogo(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault()
    if (typeof window !== 'undefined') {
      localStorage.setItem('company_name', nom)
      localStorage.setItem('company_rccm', rccm)
      if (logo) {
        localStorage.setItem('company_logo', logo)
      } else {
        localStorage.removeItem('company_logo')
      }
      setIsSavedInfo(true)
      setTimeout(() => setIsSavedInfo(false), 3000)
    }
  }

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault()
    await addDynamicField({ nom: newFieldName, methode_repartition: newFieldMethod })
    setNewFieldName('')
    setIsSavedField(true)
    setTimeout(() => setIsSavedField(false), 3000)
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      <h1>Paramètres</h1>

      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>🏢 Informations de l'Entreprise</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Ces informations apparaîtront sur l'en-tête de vos dossiers imprimés.
        </p>
        
        <form onSubmit={handleSaveCompanyInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Nom de l'entreprise</label>
            <input 
              type="text" 
              className="input-field" 
              value={nom} 
              onChange={e => setNom(e.target.value)} 
              placeholder="Ex: Ma Société Import-Export" 
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Numéro RCCM</label>
            <input 
              type="text" 
              className="input-field" 
              value={rccm} 
              onChange={e => setRccm(e.target.value)} 
              placeholder="Ex: CI-ABJ-2023-B-12345" 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Logo de l'entreprise</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {logo && (
                <div style={{ position: 'relative', background: '#fff', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                  <img src={logo} alt="Logo" style={{ maxHeight: '60px', maxWidth: '150px', objectFit: 'contain' }} />
                  <button 
                    type="button" 
                    onClick={() => setLogo(null)} 
                    style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload} 
                style={{ fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
            💾 Enregistrer les informations
          </button>
          {isSavedInfo && <span style={{ color: 'var(--success)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Informations enregistrées avec succès !</span>}
        </form>
      </div>

      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>💰 Types de Frais et Règle de Répartition</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Gérez les types de frais disponibles lors de l'édition d'un dossier.
        </p>

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
          {dynamicFields.map(field => (
            <li key={field.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
              <strong>{field.nom}</strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Prorata : <strong>{field.methode_repartition}</strong>
              </span>
            </li>
          ))}
          {dynamicFields.length === 0 && (
            <li style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Aucun type de frais configuré.</li>
          )}
        </ul>

        <form onSubmit={handleAddField} style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-glass)' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Ajouter un nouveau type de frais</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Nom du frais</label>
              <input 
                type="text" 
                className="input-field" 
                value={newFieldName} 
                onChange={e => setNewFieldName(e.target.value)} 
                placeholder="Ex: Frais de Douane, Manutention..." 
                required 
              />
            </div>
            <div className="input-group">
              <label className="input-label">Méthode de répartition</label>
              <select 
                className="input-field" 
                value={newFieldMethod} 
                onChange={e => setNewFieldMethod(e.target.value as any)}
                required
              >
                <option value="valeur">Au prorata de la Valeur FOB</option>
                <option value="poids">Au prorata du Poids</option>
                <option value="quantite">Au prorata de la Quantité</option>
              </select>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            + Ajouter
          </button>
          {isSavedField && <span style={{ color: 'var(--success)', fontSize: '0.875rem', marginLeft: '1rem' }}>Frais ajouté avec succès !</span>}
        </form>

      </div>
    </div>
  )
}
