const mongoose = require("mongoose");

const FavorisSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    produit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Produit",
        required: true
    }
}, {
    timestamps: true,
    collection: "favoris"
});
FavorisSchema.index({ user: 1, produit: 1 }, { unique: true });


//    STATICS
FavorisSchema.statics.addFavori = async function (userId, produitId) {
    return this.create({ user: userId, produit: produitId });
};

FavorisSchema.statics.removeFavori = async function (userId, produitId) {
    return this.findOneAndDelete({ user: userId, produit: produitId });
};

FavorisSchema.statics.getUserFavoris = function (userId) {
    return this.find({ user: userId })
        .populate("produit")
        .sort({ createdAt: -1 });
};

FavorisSchema.statics.isFavorite = async function (userId, produitId) {
    const fav = await this.findOne({ user: userId, produit: produitId });
    return !!fav;
};

module.exports = mongoose.model("Favoris", FavorisSchema);