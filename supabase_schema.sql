-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table : dossiers
CREATE TABLE IF NOT EXISTS dossiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference TEXT NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    devise TEXT NOT NULL DEFAULT 'EUR',
    taux_change DECIMAL NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table : champs_dynamiques (Types de frais personnalisés)
CREATE TABLE IF NOT EXISTS champs_dynamiques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    methode_repartition TEXT NOT NULL CHECK (methode_repartition IN ('poids', 'valeur', 'quantite')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table : produits
CREATE TABLE IF NOT EXISTS produits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    quantite DECIMAL NOT NULL,
    poids_unitaire DECIMAL NOT NULL,
    prix_achat_unitaire DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table : frais_dossier
CREATE TABLE IF NOT EXISTS frais_dossier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
    champ_dynamique_id UUID NOT NULL REFERENCES champs_dynamiques(id) ON DELETE RESTRICT,
    montant DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion de données de base pour les champs dynamiques (Frais standards)
INSERT INTO champs_dynamiques (nom, methode_repartition) VALUES
('Fret (Transport)', 'poids'),
('Droits de Douane', 'valeur'),
('Assurance', 'valeur')
ON CONFLICT DO NOTHING;
