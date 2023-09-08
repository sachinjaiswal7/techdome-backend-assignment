import User from "../models/userModel.js";
import CustomError from "../utils/CustomError.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


// this function is used to register a new user to our website 
export const registerUser = async (req, res, next) => {
    // taking the fields from the req.body object 
    const { name, email, password ,role} = req.body;

    //checking if any of the field is not provided
    if (!name || !email || !password || !role) {
        return next(new CustomError(400, "name, email,password and role are required fields"))
    }
    try {

        if(password.length < 8){
            return next(new CustomError(400,"Password should have at least 8 characters"));
        }


        // checking if the user already exists in our database with given email 
        const alreadyUser = await User.findOne({ email });
        if (alreadyUser) {
            return next(new CustomError(400, "User already exists"));
        }

        //hashing the password with bcrypt package 
        const hashedPassword = await bcrypt.hash(password, 10);

        //creating a new user in the database.
        const newUser = await User.create({ name, email, password: hashedPassword ,role});

        //creating a token with id of the user for the further authorization of the user 
        const token = jwt.sign({ user_id: newUser._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: '1d'
        });

        //sending the newuser details as the response. 
        res.status(201).json({
            success: true,
            message: "Registered Successfully",
            token,
            role
        })
    }
    catch (err) {
        //handling error if any occurs 
        next(err);
    }
}


// this function is used to login a new user to our website
export const loginUser = async (req, res, next) => {
    // taking the required fields from the request object 
    const { email, password } = req.body;
    try {

        if (!email || !password) { // checking if any of the field is undefined or null.
            return next(new CustomError(400, "All fields are required"));
        }

        // finding the user in the database who is associated with the email given
        const loginUser = await User.findOne({ email }).select("+password");

        // if user doesn't exists then send an error  else compare the passwords 
        if (!loginUser) {
            return next(new CustomError(400, "No user exists with this email"));
        }

        // comparing the password given by the user to the password which is available in our mongoDB database.
        const isMatched = await bcrypt.compare(password, loginUser.password);
        if (!isMatched) {
            return next(new CustomError(400, "Invalid  Password"));
        }


        //creating a token with id of the user for the further authorization of the user 
        const token = jwt.sign({ user_id: loginUser._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: '1d'
        });

        res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            role : loginUser.role
        })

    }
    catch (err) {
        next(err);
    }
}