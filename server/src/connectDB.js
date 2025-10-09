import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        
        if (!uri) {
            throw new Error("Falta la variable MONGO_URI en el archivo .env");
        }
        
        await mongoose.connect(uri, {});
        console.log("✅ Conectado a MongoDB");
    } catch (error) {
        console.error("❌ Error conectando a MongoDB:", error.message);
        process.exit(1);
    }
};

export default connectDB;
