import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';


const app= express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"1000kb"}))
app.use(express.urlencoded({extended:true, limit:"1000kb"}))
app.use(express.static("public"))
app.use(cookieParser())



// Routes import
import userRouter from './routes/user.route.js'
import videoRouter from '../src/routes/video.route.js'
import commentRouter from './routes/comment.route.js'
import likeRouter from "./routes/like.route.js";
import tweetRouter from "./routes/tweet.route.js"
import subscriptionRouter from './routes/subscription.route.js'

app.use("/api/v1/users",userRouter)
app.use("/api/v1/video",videoRouter)
app.use("/api/v1/comment",commentRouter)
app.use("/api/v1/like",likeRouter)
// app.post("/api/v1/tweet-test", (req, res) => res.json({message: "It works!"}));
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/subs",subscriptionRouter)

// http:localhost:8000/api/v1/users/register

export {app}