'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStore, Product, DossierFee, DynamicField } from '@/context/StoreContext'

export default function DossierDetail() {
  const params = useParams()
  const router = useRouter()
  const dossierId = params.id as string
  
  const { dossiers, updateDossier, dynamicFields, addDynamicField } = useStore()
  const dossier = dossiers.find(d => d.id === dossierId)

  const [companyInfo, setCompanyInfo] = useState<{nom: string, rccm: string, contact: string, email: string, adresse: string, logo: string | null}>({ nom: '', rccm: '', contact: '', email: '', adresse: '', logo: null })

  // State for new product
  const [newProdName, setNewProdName] = useState('')
  const [newProdQty, setNewProdQty] = useState('')
  const [newProdWeight, setNewProdWeight] = useState('')
  const [newProdPrice, setNewProdPrice] = useState('')

  // State for new fee
  const [selectedFieldId, setSelectedFieldId] = useState('')
  const [newFeeAmount, setNewFeeAmount] = useState('')

  // State for editing product
  const [editingProductId, setEditingProductId] = useState<string | null>(null)

  // State for editing fee
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null)

  // State for creating new dynamic field
  const [isCreatingField, setIsCreatingField] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldMethod, setNewFieldMethod] = useState<'poids'|'valeur'|'quantite'>('valeur')


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('company_name')
      const savedRccm = localStorage.getItem('company_rccm')
      const savedContact = localStorage.getItem('company_contact')
      const savedEmail = localStorage.getItem('company_email')
      const savedAdresse = localStorage.getItem('company_adresse')
      const savedLogo = localStorage.getItem('company_logo')
      
      setCompanyInfo({
        nom: savedName || '',
        rccm: savedRccm || '',
        contact: savedContact || '',
        email: savedEmail || '',
        adresse: savedAdresse || '',
        logo: savedLogo || null
      })

      if (window.location.search.includes('print=true')) {
        setTimeout(() => window.print(), 500)
      }
    }
  }, [])

  if (!dossier) return <div style={{ padding: '2rem' }}>Dossier introuvable.</div>

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingProductId) {
      // Logic for editing
      const updatedProducts = dossier.produits.map(p => 
        p.id === editingProductId ? {
          ...p,
          nom: newProdName,
          quantite: parseFloat(newProdQty),
          poids_unitaire: parseFloat(newProdWeight),
          prix_achat_unitaire: parseFloat(newProdPrice)
        } : p
      )
      await updateDossier({ ...dossier, produits: updatedProducts })
      setEditingProductId(null)
    } else {
      // Logic for adding
      const product: Product = {
        id: Math.random().toString(36).substr(2, 9), // Supabase ignorera cet id pour l'insertion de nouveaux produits, mais il est nécessaire pour le type TS local
        nom: newProdName,
        quantite: parseFloat(newProdQty),
        poids_unitaire: parseFloat(newProdWeight),
        prix_achat_unitaire: parseFloat(newProdPrice)
      }
      await updateDossier({ ...dossier, produits: [...dossier.produits, product] })
    }
    
    setNewProdName(''); setNewProdQty(''); setNewProdWeight(''); setNewProdPrice('');
  }

  const handleEditProductClick = (product: Product) => {
    setEditingProductId(product.id)
    setNewProdName(product.nom)
    setNewProdQty(product.quantite.toString())
    setNewProdWeight(product.poids_unitaire.toString())
    setNewProdPrice(product.prix_achat_unitaire.toString())
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingProductId(null)
    setNewProdName(''); setNewProdQty(''); setNewProdWeight(''); setNewProdPrice('');
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce produit ?")) {
      const updatedProducts = dossier.produits.filter(p => p.id !== productId)
      await updateDossier({ ...dossier, produits: updatedProducts })
    }
  }

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFieldId || !newFeeAmount) return
    
    let newFrais = [...dossier.frais]
    
    if (editingFeeId) {
      // Logic for editing a fee
      const feeIndex = newFrais.findIndex(f => f.fieldId === editingFeeId)
      if (feeIndex >= 0) {
        // If the user changed the type of fee (selectedFieldId) during edit
        if (selectedFieldId !== editingFeeId) {
           // check if new type already exists
           const existingTargetIndex = newFrais.findIndex(f => f.fieldId === selectedFieldId)
           if (existingTargetIndex >= 0 && existingTargetIndex !== feeIndex) {
              newFrais[existingTargetIndex].montant += parseFloat(newFeeAmount)
              newFrais = newFrais.filter((_, idx) => idx !== feeIndex)
           } else {
              newFrais[feeIndex] = { fieldId: selectedFieldId, montant: parseFloat(newFeeAmount) }
           }
        } else {
           newFrais[feeIndex].montant = parseFloat(newFeeAmount)
        }
      }
      setEditingFeeId(null)
    } else {
      // Logic for adding a fee
      const fee: DossierFee = {
        fieldId: selectedFieldId,
        montant: parseFloat(newFeeAmount)
      }
      const existingFeeIndex = newFrais.findIndex(f => f.fieldId === selectedFieldId)
      if (existingFeeIndex >= 0) {
        newFrais[existingFeeIndex].montant += fee.montant
      } else {
        newFrais.push(fee)
      }
    }
    
    await updateDossier({ ...dossier, frais: newFrais })
    setNewFeeAmount('')
    setSelectedFieldId('')
  }

  const handleEditFeeClick = (fee: DossierFee) => {
    setEditingFeeId(fee.fieldId)
    setSelectedFieldId(fee.fieldId)
    setNewFeeAmount(fee.montant.toString())
  }

  const handleCancelEditFee = () => {
    setEditingFeeId(null)
    setSelectedFieldId('')
    setNewFeeAmount('')
  }

  const handleDeleteFee = async (fieldId: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce frais du dossier ?")) {
      const newFrais = dossier.frais.filter(f => f.fieldId !== fieldId)
      await updateDossier({ ...dossier, frais: newFrais })
    }
  }

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault()
    const field = {
      nom: newFieldName,
      methode_repartition: newFieldMethod
    }
    await addDynamicField(field)
    
    // Pour sélectionner le champ nouvellement créé, nous pourrions avoir besoin de le retrouver, 
    // mais refreshData de addDynamicField l'ajoutera dans dynamicFields. 
    // Si on veut le sélectionner, il faudrait peut-être utiliser son nom pour le trouver car l'id est généré par DB.
    // Simplification: on réinitialise l'ID sélectionné
    setSelectedFieldId('')
    setIsCreatingField(false)
    setNewFieldName('')
  }

  // --- ENGINE ---
  const totalPoids = dossier.produits.reduce((acc, p) => acc + (p.quantite * p.poids_unitaire), 0)
  const totalFOBDevise = dossier.produits.reduce((acc, p) => acc + (p.quantite * p.prix_achat_unitaire), 0)
  const totalFOBLocal = totalFOBDevise * dossier.taux_change
  const totalQuantite = dossier.produits.reduce((acc, p) => acc + p.quantite, 0)

  // Calculate breakdown for each product
  const calculatedProducts = dossier.produits.map(p => {
    const poidsTotal = p.quantite * p.poids_unitaire
    const fobDevise = p.quantite * p.prix_achat_unitaire
    const fobLocal = fobDevise * dossier.taux_change

    // Calculate fees
    let totalFraisLocal = 0
    const fraisDetails: Record<string, number> = {}

    dossier.frais.forEach(fee => {
      const field = dynamicFields.find(f => f.id === fee.fieldId)
      if (!field) return
      
      let part = 0
      if (field.methode_repartition === 'poids' && totalPoids > 0) {
        part = (poidsTotal / totalPoids) * fee.montant
      } else if (field.methode_repartition === 'valeur' && totalFOBLocal > 0) {
        part = (fobLocal / totalFOBLocal) * fee.montant
      } else if (field.methode_repartition === 'quantite' && totalQuantite > 0) {
        part = (p.quantite / totalQuantite) * fee.montant
      }
      fraisDetails[field.nom] = part
      totalFraisLocal += part
    })

    const prixRevientTotalLocal = fobLocal + totalFraisLocal
    const prixRevientUnitaireLocal = prixRevientTotalLocal / p.quantite

    return {
      ...p,
      poidsTotal,
      fobDevise,
      fobLocal,
      fraisDetails,
      totalFraisLocal,
      prixRevientTotalLocal,
      prixRevientUnitaireLocal
    }
  })

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1.5rem', borderBottom: '2px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {companyInfo.logo && <img src={companyInfo.logo} alt="Logo" style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain' }} />}
          <div>
            {companyInfo.nom && <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{companyInfo.nom}</h2>}
            {companyInfo.rccm && <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>RCCM: {companyInfo.rccm}</p>}
            {(companyInfo.contact || companyInfo.email || companyInfo.adresse) && (
              <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {companyInfo.adresse && <span>📍 {companyInfo.adresse} <br/></span>}
                {companyInfo.contact && <span>📞 {companyInfo.contact} </span>}
                {companyInfo.contact && companyInfo.email && <span> | </span>}
                {companyInfo.email && <span>✉️ {companyInfo.email}</span>}
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Dossier: {dossier.reference}</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Créé le {new Date(dossier.date_creation).toLocaleDateString()}</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
            <p style={{ margin: 0 }}><strong>Devise:</strong> {dossier.devise}</p>
            <p style={{ margin: 0 }}><strong>Taux:</strong> {dossier.taux_change}</p>
          </div>
        </div>
      </div>

      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)' }}>
        {/* Products Form */}
        <div className="glass-panel" id="product-form">
          <h3>{editingProductId ? 'Modifier le Produit' : 'Ajouter un Produit'}</h3>
          <form onSubmit={handleAddProduct} style={{ marginTop: '1rem' }}>
            <div className="input-group">
              <input className="input-field" placeholder="Nom du produit" value={newProdName} onChange={e => setNewProdName(e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <input type="number" className="input-field" placeholder="Qté" value={newProdQty} onChange={e => setNewProdQty(e.target.value)} required />
              </div>
              <div className="input-group">
                <input type="number" step="0.01" className="input-field" placeholder="Poids Un. (kg)" value={newProdWeight} onChange={e => setNewProdWeight(e.target.value)} required />
              </div>
              <div className="input-group">
                <input type="number" step="0.01" className="input-field" placeholder={`PU FOB (${dossier.devise})`} value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} required />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              {editingProductId && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Annuler</button>
              )}
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {editingProductId ? 'Enregistrer les modifications' : '+ Ajouter Produit'}
              </button>
            </div>
          </form>
        </div>

        {/* Fees Form */}
        <div className="glass-panel">
          <h3>{editingFeeId ? 'Modifier le Frais' : 'Ajouter des Frais'}</h3>
          {!isCreatingField ? (
            <>
              <form onSubmit={handleAddFee} style={{ marginTop: '1rem' }}>
                <div className="input-group">
                  <select className="input-field" value={selectedFieldId} onChange={e => setSelectedFieldId(e.target.value)} required>
                    <option value="" disabled>Sélectionner un type de frais...</option>
                    {dynamicFields.map(f => (
                      <option key={f.id} value={f.id}>{f.nom} (Répartition par {f.methode_repartition})</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsCreatingField(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', textAlign: 'right', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    + Créer un nouveau type de frais
                  </button>
                </div>
                <div className="input-group">
                  <input type="number" step="0.01" className="input-field" placeholder="Montant Total (Local)" value={newFeeAmount} onChange={e => setNewFeeAmount(e.target.value)} required />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  {editingFeeId && (
                    <button type="button" className="btn btn-secondary" onClick={handleCancelEditFee}>Annuler</button>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {editingFeeId ? 'Enregistrer les modifications' : '+ Appliquer au Dossier'}
                  </button>
                </div>
              </form>

              {/* List of applied fees */}
              {dossier.frais.length > 0 && (
                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Frais déjà appliqués :</h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {dossier.frais.map((fee) => {
                      const field = dynamicFields.find(f => f.id === fee.fieldId)
                      return (
                        <li key={fee.fieldId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                          <div>
                            <strong>{field?.nom}</strong> <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>({fee.montant.toFixed(2)})</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleEditFeeClick(fee)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }} title="Modifier">✏️</button>
                            <button onClick={() => handleDeleteFee(fee.fieldId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Supprimer">🗑️</button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleCreateField} style={{ marginTop: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <h4 style={{ marginBottom: '1rem' }}>Nouveau Type de Frais</h4>
              <div className="input-group">
                <input type="text" className="input-field" placeholder="Nom du frais (ex: Manutention)" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Méthode de répartition</label>
                <select className="input-field" value={newFieldMethod} onChange={e => setNewFieldMethod(e.target.value as any)}>
                  <option value="valeur">Au prorata de la Valeur FOB</option>
                  <option value="poids">Au prorata du Poids</option>
                  <option value="quantite">Au prorata de la Quantité</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreatingField(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Créer</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Summary Table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Synthèse et Prix de Revient</h3>
          <button className="btn btn-secondary no-print" onClick={() => window.print()} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
            🖨️ Imprimer la Synthèse
          </button>
        </div>
        
        {calculatedProducts.length === 0 ? (
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Ajoutez des produits pour voir les calculs.</p>
        ) : (
          <table style={{ width: '100%', marginTop: '1.5rem', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.75rem' }}>Produit</th>
                <th style={{ padding: '0.75rem' }}>Qté</th>
                <th style={{ padding: '0.75rem' }}>Poids Total</th>
                <th style={{ padding: '0.75rem' }}>FOB ({dossier.devise})</th>
                <th style={{ padding: '0.75rem' }}>FOB Local</th>
                {dossier.frais.map((fee, i) => {
                   const field = dynamicFields.find(f => f.id === fee.fieldId)
                   return <th key={i} style={{ padding: '0.75rem', color: 'var(--warning)' }}>{field?.nom}</th>
                })}
                <th style={{ padding: '0.75rem', color: 'var(--success)' }}>Revient Total</th>
                <th style={{ padding: '0.75rem', color: 'var(--accent-primary)', fontSize: '1rem' }}>Prix Unitaire</th>
                <th className="no-print" style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {calculatedProducts.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{p.nom}</td>
                  <td style={{ padding: '0.75rem' }}>{p.quantite}</td>
                  <td style={{ padding: '0.75rem' }}>{p.poidsTotal.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem' }}>{p.fobDevise.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem' }}>{p.fobLocal.toFixed(2)}</td>
                  
                  {dossier.frais.map((fee, i) => {
                    const field = dynamicFields.find(f => f.id === fee.fieldId)
                    const val = field ? p.fraisDetails[field.nom] || 0 : 0
                    return <td key={i} style={{ padding: '0.75rem' }}>{val.toFixed(2)}</td>
                  })}
                  
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{p.prixRevientTotalLocal.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '1rem' }}>
                    {p.prixRevientUnitaireLocal.toFixed(2)}
                  </td>
                  <td className="no-print" style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleEditProductClick(p)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: '1.2rem' }}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '1.2rem' }}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Totals Row */}
              <tr style={{ background: 'var(--bg-primary)', fontWeight: 'bold' }}>
                <td style={{ padding: '0.75rem' }}>TOTAL</td>
                <td style={{ padding: '0.75rem' }}>{totalQuantite}</td>
                <td style={{ padding: '0.75rem' }}>{totalPoids.toFixed(2)}</td>
                <td style={{ padding: '0.75rem' }}>{totalFOBDevise.toFixed(2)}</td>
                <td style={{ padding: '0.75rem' }}>{totalFOBLocal.toFixed(2)}</td>
                {dossier.frais.map((fee, i) => (
                  <td key={i} style={{ padding: '0.75rem' }}>{fee.montant.toFixed(2)}</td>
                ))}
                <td style={{ padding: '0.75rem' }}>
                  {(totalFOBLocal + dossier.frais.reduce((sum, f) => sum + f.montant, 0)).toFixed(2)}
                </td>
                <td></td>
                <td className="no-print"></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
