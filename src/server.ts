import "reflect-metadata";
import {createConnection} from "typeorm";
import express  from "express";
import morgan from "morgan";
import dotenv from 'dotenv';
import cookieParser from'cookie-parser';
import cors from 'cors'

dotenv.config()

import authRoutes from './routes/auth'

import postRoutes from './routes/posts'

import clubRoutes from './routes/clubs'

import miscRoutes from './routes/misc'

import trim from './middleware/trim'


const app =express()
const PORT = process.env.PORT


app.use(express.json())
app.use(morgan('dev'))
app.use(trim)
app.use(cookieParser())
app.use(cors({
    credentials:true,
    origin:'http://localhost:3000',
    optionsSuccessStatus:200
}))

app.use(express.static('public'))



app.get('/', (_,res) => res.send("Hello world") )
app.use('/api/auth',authRoutes)
app.use('/api/posts',postRoutes)
app.use('/api/clubs',clubRoutes)
app.use('/api/misc',miscRoutes)


app.listen(PORT,async () => {
    console.log("Server running at http://localhost: ${PORT}")

    try {
        await createConnection()
        console.log('Database Connected!')
    } catch(err){
        console.log(err)
    }
})