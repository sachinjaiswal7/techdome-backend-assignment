import express from "express";
import dotenv from "dotenv";
import userRoute from "./routes/userRoute.js";
import mongoose from "mongoose";
import cors from "cors";
import loanRoute from "./routes/loanRoute.js";

//configuration for dotenv file 
dotenv.config();


//connecting mongodb
mongoose.connect(process.env.DB_URI, {
    dbName : "techdome"
}).then(() => {
    console.log("Database connected successfully");
}).catch((err) => {
    console.log(err);
})

//making the express server
const app = express();


//using cors to be able to make request from any other domains 
app.use(cors());



//middlewares so that data can come inside the req.body object
app.use(express.json());
app.use(express.urlencoded({extended : true}));



//using various routes according to the need of our web app
app.use("/user",userRoute);
app.use("/loan",loanRoute);


// this is used to handle the errors sent by the various routes of our web app
app.use((err,req,res,next) => {
    if(!err.statusCode)err.statusCode = 500;
    if(!err.message)err.message = "Internal Server Error";
    res.status(err.statusCode).json({
        success : false,
        message : err.message
    })
})

//listening at some port. 
app.listen(process.env.PORT, () => {
    console.log(`Server is running at the port ${process.env.PORT}`);
})