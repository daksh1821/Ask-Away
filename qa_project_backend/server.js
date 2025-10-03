import express from 'express'

const app = use(express);
const PORT = process.env.PORT || 6000;
app.use(express.json());
app.get('/',(Req,res)=>{
    res.send("Hello World");
});
app.listen(PORT,()=>{
    console.log(`Server is running on port http://localhost/${PORT}`);
})