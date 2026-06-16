'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
  isLoading: boolean;
  error: string | null;
  addDossier: (dossier: Omit<Dossier, 'id'>) => Promise<string>;
  updateDossier: (dossier: Dossier) => Promise<void>;
  deleteDossier: (id: string) => Promise<void>;
  addDynamicField: (field: Omit<DynamicField, 'id'>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const { data: fieldsData } = await supabase.from('champs_dynamiques').select('*');
      if (fieldsData) {
        setDynamicFields(fieldsData.map(f => ({
          id: f.id,
          nom: f.nom,
          methode_repartition: f.methode_repartition as RepartitionMethod
        })));
      }

      const { data: dossiersData } = await supabase.from('dossiers').select('*').order('date_creation', { ascending: false });
      const { data: produitsData } = await supabase.from('produits').select('*');
      const { data: fraisData } = await supabase.from('frais_dossier').select('*');

      if (dossiersData) {
        const formattedDossiers: Dossier[] = dossiersData.map(d => ({
          id: d.id,
          reference: d.reference,
          date_creation: d.date_creation,
          devise: d.devise,
          taux_change: Number(d.taux_change),
          produits: (produitsData || [])
            .filter(p => p.dossier_id === d.id)
            .map(p => ({
              id: p.id,
              nom: p.nom,
              quantite: Number(p.quantite),
              poids_unitaire: Number(p.poids_unitaire),
              prix_achat_unitaire: Number(p.prix_achat_unitaire)
            })),
          frais: (fraisData || [])
            .filter(f => f.dossier_id === d.id)
            .map(f => ({
              fieldId: f.champ_dynamique_id,
              montant: Number(f.montant)
            }))
        }));
        setDossiers(formattedDossiers);
      }
    } catch (err: any) {
      console.error('Error fetching data from Supabase:', err);
      setError(err.message || 'Erreur de connexion à la base de données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addDossier = async (dossier: Omit<Dossier, 'id'>): Promise<string> => {
    const { data: newDossier, error: dError } = await supabase
      .from('dossiers')
      .insert({
        reference: dossier.reference,
        devise: dossier.devise,
        taux_change: dossier.taux_change
      })
      .select()
      .single();

    if (dError) {
      console.error('Error adding dossier', dError);
      throw dError;
    }

    const dossierId = newDossier.id;

    if (dossier.produits.length > 0) {
      await supabase.from('produits').insert(
        dossier.produits.map(p => ({
          dossier_id: dossierId,
          nom: p.nom,
          quantite: p.quantite,
          poids_unitaire: p.poids_unitaire,
          prix_achat_unitaire: p.prix_achat_unitaire
        }))
      );
    }

    if (dossier.frais.length > 0) {
      await supabase.from('frais_dossier').insert(
        dossier.frais.map(f => ({
          dossier_id: dossierId,
          champ_dynamique_id: f.fieldId,
          montant: f.montant
        }))
      );
    }

    await refreshData();
    return dossierId;
  };

  const updateDossier = async (dossier: Dossier) => {
    await supabase.from('dossiers').update({
      reference: dossier.reference,
      devise: dossier.devise,
      taux_change: dossier.taux_change
    }).eq('id', dossier.id);

    await supabase.from('produits').delete().eq('dossier_id', dossier.id);
    await supabase.from('frais_dossier').delete().eq('dossier_id', dossier.id);

    if (dossier.produits.length > 0) {
      await supabase.from('produits').insert(
        dossier.produits.map(p => ({
          dossier_id: dossier.id,
          nom: p.nom,
          quantite: p.quantite,
          poids_unitaire: p.poids_unitaire,
          prix_achat_unitaire: p.prix_achat_unitaire
        }))
      );
    }

    if (dossier.frais.length > 0) {
      await supabase.from('frais_dossier').insert(
        dossier.frais.map(f => ({
          dossier_id: dossier.id,
          champ_dynamique_id: f.fieldId,
          montant: f.montant
        }))
      );
    }

    await refreshData();
  };

  const deleteDossier = async (id: string) => {
    await supabase.from('dossiers').delete().eq('id', id);
    await refreshData();
  };

  const addDynamicField = async (field: Omit<DynamicField, 'id'>) => {
    await supabase.from('champs_dynamiques').insert({
      nom: field.nom,
      methode_repartition: field.methode_repartition
    });
    await refreshData();
  };

  return (
    <StoreContext.Provider value={{ dossiers, dynamicFields, isLoading, error, addDossier, updateDossier, deleteDossier, addDynamicField, refreshData }}>
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
