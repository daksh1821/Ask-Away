import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/configs/db.js';
dotenv.config();
connectDB();
const app = express();
const PORT = process.env.PORT || 6000;
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173' 
  }));
app.get('/',(Req,res)=>{
    res.send("Hello World");
});
app.listen(PORT,()=>{
    console.log(`Server is running on port http://localhost/${PORT}`);
})
