const mongoose = require("mongoose");
const { Schema } = mongoose;

const VarianteSchema = new Schema({
    type: { type: String },   // ex: "taille", "couleur"
    valeur: { type: String }, // ex: "XL", "Rouge"
    prix: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 }
}, { _id: false });

const ProduitCategories = new Schema({
    nom:{type: String, required: true}
})

const ProduitSchema = new Schema({
    nom: { type: String, required: true, trim: true },
    description: { type: String },
    prix: { type: Number, required: true, min:0 },
    boutique: {
        type: Schema.Types.ObjectId,
        ref: "Boutique",
        required: true,
        index: true
    },
    categories: [ProduitCategories],
    images: [String],
    variantes: [VarianteSchema],
    actif: { type: Boolean, default: true }
}, { timestamps: true });

ProduitSchema.index({
    nom: "text",
    description: "text"
});

module.exports = mongoose.model("Produit", ProduitSchema);