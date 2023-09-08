import CustomError from "../utils/CustomError.js";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js"


const isAuthenticated = async(req,res,next) => {
    let token = req.headers['authorization'];
    if(!token){
        return next(new CustomError(400, "No authorization token is provided"));
    }
    try{
    const decodedToken = jwt.verify(token.split(" ")[1],process.env.JWT_SECRET_KEY);
    const user_id = decodedToken.user_id;
    req.user = await User.findById(user_id);
    next();

    }catch(err){
        next(err);
    }

}

export default isAuthenticated;