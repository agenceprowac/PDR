'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export type RepartitionMethod = 'poids' | 'valeur' | 'quantite';

export interface DynamicField {
  id: string;
  nom: string;
  methode_repartition: RepartitionMethod;
}

export interface Product {
  id: string;
  nom: string;
  quantite: number;
  poids_unitaire: number; // en kg
  prix_achat_unitaire: number; // dans la devise du dossier
}

export interface DossierFee {
  fieldId: string;
  montant: number; // dans la devise du dossier ou en FCFA (on va supposer en FCFA ou devise locale pour simplifier le proto)
}

export interface Dossier {
  id: string;
  reference: string;
  date_creation: string;
  devise: string;
  taux_change: number; // ex: 655.957 pour EUR -> FCFA
  produits: Product[];
  frais: DossierFee[];
}

interface StoreContextType {
  dossiers: Dossier[];
  dynamicFields: DynamicField[];
  addDossier: (dossier: Dossier) => void;
  updateDossier: (dossier: Dossier) => void;
  deleteDossier: (id: string) => void;
  addDynamicField: (field: DynamicField) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Mock Data initial
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([
    { id: '1', nom: 'Fret (Transport)', methode_repartition: 'poids' },
    { id: '2', nom: 'Droits de Douane', methode_repartition: 'valeur' },
    { id: '3', nom: 'Assurance', methode_repartition: 'valeur' }
  ]);

  const [dossiers, setDossiers] = useState<Dossier[]>([
    {
      id: 'd1',
      reference: 'IMP-2026-001',
      date_creation: new Date().toISOString(),
      devise: 'EUR',
      taux_change: 655.957,
      produits: [
        { id: 'p1', nom: 'Oranges', quantite: 541, poids_unitaire: 15, prix_achat_unitaire: 9.1 },
        { id: 'p2', nom: 'Mandarines', quantite: 832, poids_unitaire: 10, prix_achat_unitaire: 8.32 }
      ],
      frais: [
        { fieldId: '1', montant: 4528512 }, // Fret
        { fieldId: '2', montant: 10271132 }  // Douane
      ]
    }
  ]);

  const addDossier = (dossier: Dossier) => setDossiers([...dossiers, dossier]);
  const updateDossier = (updated: Dossier) => setDossiers(dossiers.map(d => d.id === updated.id ? updated : d));
  const deleteDossier = (id: string) => setDossiers(dossiers.filter(d => d.id !== id));
  const addDynamicField = (field: DynamicField) => setDynamicFields([...dynamicFields, field]);

  return (
    <StoreContext.Provider value={{ dossiers, dynamicFields, addDossier, updateDossier, deleteDossier, addDynamicField }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
