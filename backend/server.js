const app = require("./src/app");
const PORT = process.env.PORT || 3000;
const connectDB = require("./src/config/database");

(async () => {
    try{
        console.log(" Demarrage du server");
        connectDB();
        app.listen(PORT, () => {
            console.log(`Votre Serveur Express est demarré sur http://localhost:${PORT} tay`);
        });
    }catch (error){
        console.error("ORRERAAAAA :", error);
    }
})();

