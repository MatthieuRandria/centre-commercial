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
   first_name VARCHAR(50),
   last_name VARCHAR(50),
   image VARCHAR(255),
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE centre_commercial (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(100) NOT NULL,
   description TEXT,
   image VARCHAR(255),
   heure_ouverture TIME,
   heure_fermeture TIME,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE boutique_categ (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE boutique (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(100) NOT NULL,
   description TEXT,
   location_number VARCHAR(50),
   phone VARCHAR(30),
   logo VARCHAR(255),
   banner VARCHAR(255),
   status TINYINT DEFAULT 1 COMMENT '0=fermée,1=ouverte',
   heure_ouverture TIME,
   heure_fermeture TIME,
   centre_id INT NOT NULL,
   categorie_id INT NOT NULL,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (centre_id) REFERENCES centre_commercial(id),
   FOREIGN KEY (categorie_id) REFERENCES boutique_categ(id)
);

CREATE TABLE contract_boutique (
   id INT AUTO_INCREMENT PRIMARY KEY,
   boutique_id INT NOT NULL,
   start_date DATE NOT NULL,
   end_date DATE,
   status TINYINT COMMENT '0=inactif,1=actif',
   FOREIGN KEY (boutique_id) REFERENCES boutique(id)
);

CREATE TABLE produits (
   id INT AUTO_INCREMENT PRIMARY KEY,
   boutique_id INT NOT NULL,
   name VARCHAR(100) NOT NULL,
   description TEXT,
   price DECIMAL(15,2) NOT NULL,
   stock INT DEFAULT 0,
   is_active BOOLEAN DEFAULT TRUE,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (boutique_id) REFERENCES boutique(id)
);

CREATE TABLE produits_photos (
   id INT AUTO_INCREMENT PRIMARY KEY,
   produit_id INT NOT NULL,
   url VARCHAR(255) NOT NULL,
   FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
);

CREATE TABLE wishlist (
   id INT AUTO_INCREMENT PRIMARY KEY,
   user_id INT NOT NULL UNIQUE,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE wishlist_details (
   id INT AUTO_INCREMENT PRIMARY KEY,
   wishlist_id INT NOT NULL,
   produit_id INT NOT NULL,
   UNIQUE (wishlist_id, produit_id),
   FOREIGN KEY (wishlist_id) REFERENCES wishlist(id) ON DELETE CASCADE,
   FOREIGN KEY (produit_id) REFERENCES produits(id)
);

CREATE TABLE commandes (
   id INT AUTO_INCREMENT PRIMARY KEY,
   user_id INT NOT NULL,
   prix_total DECIMAL(15,2) NOT NULL,
   status TINYINT COMMENT '0=créée,1=payée,2=livrée,3=annulée',
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE commande_details (
   id INT AUTO_INCREMENT PRIMARY KEY,
   commande_id INT NOT NULL,
   produit_id INT NOT NULL,
   quantite INT NOT NULL,
   prix_unitaire DECIMAL(15,2) NOT NULL,
   UNIQUE (commande_id, produit_id),
   FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
   FOREIGN KEY (produit_id) REFERENCES produits(id)
);

CREATE TABLE user_boutique (
   user_id INT NOT NULL,
   boutique_id INT NOT NULL,
   role TINYINT COMMENT '0=employé,1=manager',
   PRIMARY KEY (user_id, boutique_id),
   FOREIGN KEY (user_id) REFERENCES users(id),
   FOREIGN KEY (boutique_id) REFERENCES boutique(id)
);
