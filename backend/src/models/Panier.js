const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema({
    produit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Produit",
        required: true
    },
    quantite: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false });

const PanierSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    articles: [ArticleSchema]
}, {
    timestamps: true,
    collection: "paniers"
});

module.exports = mongoose.model("Panier", PanierSchema);