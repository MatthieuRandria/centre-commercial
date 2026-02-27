const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const authRoutes          = require('./routes/auth.routes');
const centreRoutes        = require('./routes/centre.routes');
const boutiqueCategRoutes = require('./routes/boutiqueCategorie.routes');
const boutiqueRoutes      = require('./routes/boutique.routes');
const prodRoutes          = require('./routes/produit.routes');
const panierRoutes        = require('./routes/panier.routes');
const commandeRoutes      = require('./routes/commande.routes');
const avisRoutes          = require('./routes/avis.routes');
const favorisRoutes       = require('./routes/favoris.routes');
const dashboardRoutes     = require('./routes/dashboard.routes');

app.use('/api/auth',       authRoutes);
app.use('/centres',        centreRoutes);
app.use('/boutiquesCateg', boutiqueCategRoutes);
app.use('/boutiques',      boutiqueRoutes);
app.use('/produits',       prodRoutes);
app.use('/panier',         panierRoutes);
app.use('/commande',       commandeRoutes);
app.use('/avis',           avisRoutes);
app.use('/favoris',        favorisRoutes);
app.use('/dashboard',      dashboardRoutes);

module.exports = app;