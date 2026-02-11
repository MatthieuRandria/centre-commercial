CREATE TABLE users (
   id INT AUTO_INCREMENT PRIMARY KEY,
   email VARCHAR(100) NOT NULL UNIQUE,
   phone VARCHAR(30),
   password VARCHAR(255) NOT NULL,
   role TINYINT NOT NULL COMMENT '0=client, 1=admin, 2=manager',
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_details (
   id INT AUTO_INCREMENT PRIMARY KEY,
   user_id INT NOT NULL UNIQUE,
   nom VARCHAR(50),
   prenom VARCHAR(50),
   image VARCHAR(255),
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE centre_commercial (
   id INT AUTO_INCREMENT PRIMARY KEY,
   nom VARCHAR(100) NOT NULL,
   description TEXT,
   image VARCHAR(255),
   heure_ouverture TIME,
   heure_fermeture TIME,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE boutique_categ (
   id INT AUTO_INCREMENT PRIMARY KEY,
   nom VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE boutiques (
   id INT AUTO_INCREMENT PRIMARY KEY,
   nom VARCHAR(100) NOT NULL,
   statut TINYINT DEFAULT 1 COMMENT '0=fermée | 1=ouverte | 2=congé',
   centre_id INT NOT NULL,
   categorie_id INT NOT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (centre_id) REFERENCES centre_commercial(id),
   FOREIGN KEY (categorie_id) REFERENCES boutique_categ(id)
);

CREATE TABLE boutique_localisation (
   boutique_id INT PRIMARY KEY,
   numero_emplacement VARCHAR(50),
   etage VARCHAR(20),
   zone VARCHAR(50),
   latitude DECIMAL(10,7),
   longitude DECIMAL(10,7),
   plan_reference VARCHAR(50),
   FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE CASCADE
);

CREATE TABLE boutique_infos (
   boutique_id INT PRIMARY KEY,
   description TEXT,
   logo VARCHAR(255),
   banniere VARCHAR(255),
   couleur VARCHAR(100),
   telephone VARCHAR(30),
   email VARCHAR(100),
   FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE CASCADE
);

CREATE TABLE boutique_horaires (
   id INT AUTO_INCREMENT PRIMARY KEY,
   boutique_id INT NOT NULL,
   jour VARCHAR(10),
   ouverture TIME,
   fermeture TIME,
   FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE CASCADE
);

CREATE TABLE contract_boutique (
   id INT AUTO_INCREMENT PRIMARY KEY,
   boutique_id INT NOT NULL,
   start_date DATE,
   end_date DATE,
   status TINYINT COMMENT '0=inactif | 1=actif',
   FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
);

CREATE TABLE user_boutique (
   user_id INT NOT NULL,
   boutique_id INT NOT NULL,
   role TINYINT COMMENT '0=employé | 1=manager',
   PRIMARY KEY (user_id, boutique_id),
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
   FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE CASCADE
);

CREATE TABLE produits (
   id INT AUTO_INCREMENT PRIMARY KEY,
   boutique_id INT NOT NULL,
   nom VARCHAR(100) NOT NULL,
   categorie VARCHAR(50),
   sous_categorie VARCHAR(50),
   prix DECIMAL(15,2) NOT NULL,
   stock INT DEFAULT 0,
   actif BOOLEAN DEFAULT TRUE,
   vues INT DEFAULT 0,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
);

CREATE TABLE produit_details (
   produit_id INT PRIMARY KEY,
   description TEXT,
   en_promotion BOOLEAN DEFAULT FALSE,
   prix_promo DECIMAL(15,2),
   FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
);

CREATE TABLE produit_images (
   id INT AUTO_INCREMENT PRIMARY KEY,
   produit_id INT NOT NULL,
   url VARCHAR(255),
   FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
);

CREATE TABLE produit_variantes (
   id INT AUTO_INCREMENT PRIMARY KEY,
   produit_id INT NOT NULL,
   type VARCHAR(20) COMMENT 'taille | couleur',
   valeur VARCHAR(50),
   stock INT DEFAULT 0,
   FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
);

CREATE TABLE paniers (
   id INT AUTO_INCREMENT PRIMARY KEY,
   acheteur_id INT NOT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (acheteur_id) REFERENCES users(id)
);

CREATE TABLE panier_items (
   id INT AUTO_INCREMENT PRIMARY KEY,
   panier_id INT NOT NULL,
   produit_id INT NOT NULL,
   quantite INT DEFAULT 1,
   FOREIGN KEY (panier_id) REFERENCES paniers(id) ON DELETE CASCADE,
   FOREIGN KEY (produit_id) REFERENCES produits(id)
);

CREATE TABLE commandes (
   id INT AUTO_INCREMENT PRIMARY KEY,
   acheteur_id INT NOT NULL,
   statut VARCHAR(20) COMMENT 'en_attente | payee | preparee | prete | retiree | livree | annulee',
   total DECIMAL(15,2),
   mode_retrait VARCHAR(20) COMMENT 'click_collect | livraison',
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (acheteur_id) REFERENCES users(id)
);

CREATE TABLE commande_items (
   id INT AUTO_INCREMENT PRIMARY KEY,
   commande_id INT NOT NULL,
   produit_id INT NOT NULL,
   boutique_id INT NOT NULL,
   quantite INT,
   prix_unitaire DECIMAL(15,2),
   FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
   FOREIGN KEY (produit_id) REFERENCES produits(id),
   FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
);

-- ==================================================
-- FACULTATIF
-- ==================================================

CREATE TABLE actualites (
   id INT AUTO_INCREMENT PRIMARY KEY,
   centre_id INT NOT NULL,
   titre VARCHAR(150),
   contenu TEXT,
   date_publication DATETIME,
   FOREIGN KEY (centre_id) REFERENCES centre_commercial(id) ON DELETE CASCADE
);

CREATE TABLE evenements (
   id INT AUTO_INCREMENT PRIMARY KEY,
   centre_id INT NOT NULL,
   titre VARCHAR(150),
   description TEXT,
   date_event DATETIME,
   FOREIGN KEY (centre_id) REFERENCES centre_commercial(id) ON DELETE CASCADE
);

CREATE TABLE paiements (
   id INT AUTO_INCREMENT PRIMARY KEY,
   commande_id INT NOT NULL,
   methode VARCHAR(30) COMMENT 'carte | mobile_money | retrait',
   statut VARCHAR(30),
   montant DECIMAL(15,2),
   date_paiement DATETIME,
   FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE
);

CREATE TABLE avis (
   id INT AUTO_INCREMENT PRIMARY KEY,
   user_id INT NOT NULL,
   type VARCHAR(20) COMMENT 'produit | boutique',
   cible_id INT NOT NULL,
   note INT,
   commentaire TEXT,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE favoris (
   id INT AUTO_INCREMENT PRIMARY KEY,
   user_id INT NOT NULL,
   produit_id INT NOT NULL,
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
   FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
);

CREATE TABLE promotions (
   id INT AUTO_INCREMENT PRIMARY KEY,
   boutique_id INT NOT NULL,
   code VARCHAR(50),
   type VARCHAR(20) COMMENT 'pourcentage | montant | flash',
   valeur DECIMAL(15,2),
   date_debut DATETIME,
   date_fin DATETIME,
   FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
);

CREATE TABLE fidelite (
   id INT AUTO_INCREMENT PRIMARY KEY,
   user_id INT NOT NULL,
   points INT DEFAULT 0,
   description VARCHAR(255),
   date_action DATETIME,
   FOREIGN KEY (user_id) REFERENCES users(id)
);