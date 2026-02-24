const mongoose = require("mongoose");

const ArticleCommandeSchema = new mongoose.Schema({
    produit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Produit",
        required: true
    },
    boutique: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Boutique",
        required: true
    },
    nomProduit: String,
    prixUnitaire: Number,
    quantite: Number,
    sousTotal: Number
}, { _id: false });

const CommandeSchema = new mongoose.Schema({
    numeroCommande: {
        type: String,
        unique: true
    },
    acheteur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    articles: [ArticleCommandeSchema],
    total: Number,
    modeRetrait: {
        type: String,
        enum: ["livraison", "retrait_boutique"],
        default: "livraison"
    },
    statut: {
        type: String,
        enum: ["en_attente", "validee", "preparee", "expediee", "livree", "annulee"],
        default: "en_attente"
    }
}, {
    timestamps: true,
    collection: "commandes"
});

CommandeSchema.statics.generateNumero = function () {
    return "CMD-" + Date.now();
};

CommandeSchema.statics.findByUser = function (userId) {
    return this.find({ acheteur: userId });
};

CommandeSchema.statics.updateStatut = function (id, statut) {
    return this.findByIdAndUpdate(id, { statut }, { new: true });
};

module.exports = mongoose.model("Commande", CommandeSchema);