import express from "express"
import cors from "cors"
import dotenv from "dotenv"
const port = 5000

const app = express()

app.use(express.json())

app.listen(port,(req,res)=>{
    console.log(`app is running on port ${port}`)
})