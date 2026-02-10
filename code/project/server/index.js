import dotenv from "dotenv"
import connectDB from "./src/config/db.js";
import app from './src/app.js';

dotenv.config({ path: './.env' });
console.log("DEBUG => MONGODB_URL:", process.env.MONGODB_URL);
<<<<<<< HEAD

=======
dotenv.config({
    path: './.env'
})
>>>>>>> 535b24171ee6a745f7f6f24d151e85dcb019a0fe

const PORT = process.env.PORT || 8000

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`⚙️ Server is running at port : ${PORT}`);
        })
    })
    .catch((err) => {
        console.log("MongoDB connection failed !!! ", err);
    })