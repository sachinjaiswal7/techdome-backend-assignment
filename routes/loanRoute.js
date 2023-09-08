import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {loanRequest,loanApprove,loanDecline,termRepayment} from "../controllers/loanController.js";
import CustomError from "../utils/CustomError.js";
import Loan from "../models/loanModel.js";
import Repayment from "../models/repaymentModel.js";

const router =  express.Router();

//route to create a loan request by the user
router.post("/request", isAuthenticated,loanRequest);

//route to approve the loan by an admin
router.put("/approve",isAuthenticated,loanApprove);

//route to decline the loan request of the user by the admin
router.put("/decline",isAuthenticated,loanDecline);

//route to make repayment for terms 
router.put("/repayment",isAuthenticated,termRepayment);

//route to find the  mine pending loan request 
router.get("/pending",isAuthenticated,async(req,res,next) => {
    try{
        if(req.user.role === 'admin'){
            return next(new CustomError(400,"You are admin and this route is only accessible for admins"));
        }
        const pending = await Loan.find({userId : req.user._id,status : "PENDING"});

        res.status(200).json({
            success : true,
            pending
        })
    }catch(err){
        next(err);
    }
})
//route to find the all pending loan request 
router.get("/allPending",isAuthenticated,async(req,res,next) => {
    try{
        if(req.user.role === 'user'){
            return next(new CustomError(400,"You are a user and this route is only accessible for admins"));
        }
        const pending = await Loan.find({status : "PENDING"});

        res.status(200).json({
            success : true,
            pending
        })
    }catch(err){
        next(err);
    }
})

//route to find the approved loan request 
router.get("/approved", isAuthenticated, async(req,res,next) => {
    try{
        if(req.user.role === 'admin'){
            return next(new CustomError(400,"Admin can't access this route"));
        }
        const approved = await Loan.find({userId : req.user._id,status : "APPROVED"});

        res.status(200).json({
            success : true,
            approved
        })
    }catch(err){
        next(err);
    }
})


//route to find the declined loan request 
router.get("/declined", isAuthenticated  , async(req,res,next) => {
    try{
        if(req.user.role === 'admin'){
            return next(new CustomError(400,"Admin can't access this route"));
        }
        const declined = await Loan.find({userId : req.user._id,status : "DECLINED"});

        res.status(200).json({
            success : true,
            declined
        })
    }catch(err){
        next(err);
    }
})


//route to find the paid loan request 
router.get("/paid", isAuthenticated, async(req,res,next) => {
    try{
        if(req.user.role === 'admin'){
            return next(new CustomError(400,"Admin can't access this route"));
        }
        const paid = await Loan.find({userId : req.user._id,status : "PAID"});

        res.status(200).json({
            success : true,
            paid
        })
    }catch(err){
        next(err);
    }
})

//route to find the repayment terms for a loan
router.get("/repayment/:loanId",isAuthenticated, async(req,res,next) => {
    try{
        if(req.user.role === 'admin'){
            return next(new CustomError(400,"Admin can't access this route"));
        }
        const loanId = req.params.loanId;
        if(!loanId){
            return next(new CustomError(400,"loanId is required"));
        }

        const repay = await Repayment.findOne({loanId});
        res.status(200).json({
            success : true,
            repayments : repay.repayments
        })
    }catch(err){
        next(err);
    }
})




export default router;