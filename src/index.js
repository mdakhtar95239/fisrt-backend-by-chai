
import connectDB from './db/index.js';
import dotenv from 'dotenv';
dotenv.config({ path:'./.env'})
import { app } from './app.js';


connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log(`Express Server Error`,error)
        throw error
    })
    const port = process.env.PORT || 8000
    app.listen(port,()=>{
        console.log(`Server Is Runing on ${port}`)
    })
})
.catch((error)=>{
    console.log("MONGO DB Connection Failed !!! ",error)
    throw error
})










// import mongoose from 'mongoose';
// import { DB_NAME } from './constants.js';
// import express from 'express';
// const app = express();


/*
// 2. IIFE se pehle ';' lagana zaruri hai agar upar wali line semicolon pe khatam nahi hui
;(async () => {
    try {
        // Connection string check: yahan variable check karo

        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        
        console.log(`✅ MongoDB Connected!`);

        app.on("error", (error) => {
            console.log("Express Server Error: ", error);
            throw error;
        });
    
         const port = process.env.PORT || 8000;
        app.listen(port, () => {
            console.log(`⚙️  Server is running at port: ${port}`);
        });

    } catch (error) {
        console.error("❌ MONGODB CONNECTION FAILED: ", error);
        process.exit(1)
    }
})(); */