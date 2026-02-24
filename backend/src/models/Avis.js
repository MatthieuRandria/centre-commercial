const mongoose = require("mongoose");

const AvisSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["produit", "boutique"],
        required: true
    },
    cibleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "cibleModel"
    },
    cibleModel: {
        type: String,
        required: true,
        enum: ["Produit", "Boutique"]
    },
    note: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    commentaire: {
        type: String
    }
}, {
    timestamps: true,
    collection: "avis"
});

// STATICS
AvisSchema.statics.findByProduit = function (produitId) {
    return this.find({ type: "produit", cibleId: produitId })
        .populate("user", "nom")
        .sort({ createdAt: -1 });
};

AvisSchema.statics.findByBoutique = function (boutiqueId) {
    return this.find({ type: "boutique", cibleId: boutiqueId })
        .populate("user", "nom")
        .sort({ createdAt: -1 });
};

AvisSchema.statics.getAverageNote = async function (type, cibleId) {
    const result = await this.aggregate([
        { $match: { type, cibleId: new mongoose.Types.ObjectId(cibleId) } },
        {
            $group: {
                _id: null,
                average: { $avg: "$note" },
                count: { $sum: 1 }
            }
        }
    ]);

    return result[0] || { average: 0, count: 0 };
};

AvisSchema.statics.canUserReview = async function (userId, type, cibleId) {
    const existing = await this.findOne({ user: userId, type, cibleId });
    return !existing;
};

module.exports = mongoose.model("Avis", AvisSchema);