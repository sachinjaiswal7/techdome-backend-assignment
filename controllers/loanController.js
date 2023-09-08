import CustomError from "../utils/CustomError.js";
import Loan from "../models/loanModel.js";
import Repayment from "../models/repaymentModel.js";


//this function is to make loan request by user only
export const loanRequest = async(req,res,next) => {
    try{
        if(req.user.role !== 'user'){
           return  res.status(400).json({
                success : false,
                message :  "You are admin can't make a loan request"
            })
        }
        //taking the required fields from the body object 
        const {amount,term} = req.body;

        //checking if any of the field is null or undefined 
        if(!amount || !term){
            return next(new CustomError(400,"loanName,amount and term are required field"));
        }

        //creating a new loan request in the database with status as PENDING
        await Loan.create({userId : req.user._id,amount,term,remainingTerm : term,name : req.user.name});
        
        //sending response back to the frontend.
        res.status(201).json({
            success : true,
            message : "Loan request created"
        })

    }catch(err){
        next(err);
    }
}

//this function is to approve loan request by admin only 
export const loanApprove = async(req,res,next) => {
    try{    
        //taking the loanId feild from the body.
        const{loanId} = req.body;


        //checking if laonId is not null or undefined 
        if(!loanId){
            return next(new CustomError(400,"loanId is a required field"))
        }

        //if the approver is not admin then send error 
        if(req.user.role !== 'admin'){
            return next(new CustomError(400,"Users can't approve loans"));
        }

        //finding the loan associated with given loanId
        const findLoan = await Loan.findById(loanId);

        //if no loan associated with given loanId then send an error.
        if(!findLoan){
            return next(new CustomError(400,"No loan associated with given loanId"));
        }

        //if loan is already APPROVED then send an error.
        if(findLoan.status === "APPROVED" || findLoan.status === "DECLINED"){
            return next(new CustomError(400,"The loan associated with given loanId is not PENDING"));
        }

        
        //finding repayment amount and repayment dates for this APPROVED loan.
        const repaymentAmount = Number((findLoan.amount / findLoan.term).toFixed(2));
        const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;

        const repayments = [];
        let dueDate = new Date(findLoan.createdAt.getTime() + sevenDaysInMilliseconds);
        let repaySummation = 0;
        for(let i = 0;i < findLoan.term;i++){
            const obj = {
                dueDate,
                repaymentAmount
            }
            repaySummation += (Number(repaymentAmount));
            dueDate = new Date(dueDate.getTime() + sevenDaysInMilliseconds);
            repayments.push(obj);
        }

        // doing some precision calculation for the summation of repayments to be same as the total amount of the loan.
        repayments[repayments.length - 1].repaymentAmount += Number((findLoan.amount - repaySummation).toFixed(2));

        //creating the data of repyament for the APPROVED loan
        await Repayment.create({loanId,repayments});
        
        //updating the status of the loan.
        findLoan.status = "APPROVED";

        //saving the updates in the database.
        await findLoan.save();

        


        //sending response back to the frontend 
        res.status(200).json({
            success : true,
            message : "Loan APPROVED Successfully"
        })

    }catch(err){
        next(err);
    }
}

// this function is decline loan request by admin only 
export const loanDecline = async(req,res,next) => {
    try{
        //taking the loanId feild from the body.
        const{loanId} = req.body;


        //checking if laonId is not null or undefined 
        if(!loanId){
            return next(new CustomError(400,"loanId is a required field"))
        }

        //if the approver is not admin then send error 
        if(req.user.role !== 'admin'){
            return next(new CustomError(400,"Users can't approve loans"));
        }

        //finding the loan associated with given loanId
        const findLoan = await Loan.findById(loanId);

        //if no loan associated with given loanId then send an error.
        if(!findLoan){
            return next(new CustomError(400,"No loan associated with given loanId"));
        }

        //if loan is already APPROVED then send an error.
        if(findLoan.status === "APPROVED" || findLoan.status === "DECLINED"){
            return next(new CustomError(400,"The loan associated with given loanId is not PENDING"));
        }

        //updating the status of the loan.
        findLoan.status = "DECLINED";

        //saving the updates in the database.
        await findLoan.save();

        res.status(200).json({
            success : true,
            message : "Loan DECLINED Successfully"
        })
    }catch(err){
        next(err);
    }
}

// this function is to make repayment of particular term of the loan by user who is associated with the loan.
export const termRepayment = async(req,res,next) => {
    try{

        //checking if the caller of this function is user or not 
        if(req.user.role !== "user"){
            return next(new CustomError(400,"You are admin you can't make repayments of loan because you can't even issue loan"));
        }
        
        //taking the required fields from the body.
        let{loanId, repaymentTerm} = req.body;
        if(!loanId || !repaymentTerm){
            return next(new CustomError(400,"loanId and repaymentTerm are required"));
        }

        
        //finding the loan associated with the given loanId
        const findLoan = await Loan.findById(loanId);
        
        //checking if there is any loan in the database or not with given loanId 
        if(!findLoan){
            return next(new CustomError(400,"No loan is associated with with loanId"));
        }

        if(req.user._id.toString() !== findLoan.userId.toString()){
            return next(new CustomError(400,"this loan is not associated with the you so you can't make payments for it"));
        }
        
        //finding the repayments associated with given loanId 
        const findRepay = await Repayment.findOne({loanId});

        //checking if the given repaymentTerm is more than the actual number of term associated with loan
        if(repaymentTerm > findRepay.repayments.length){
            return next(new CustomError(400,"The repaymentTerm for the given loan is less than given term for repayment"));
        }

        //index of the term to make payment for
        repaymentTerm--;

        //if repayment is already paid then give error 
        if(findRepay.repayments[repaymentTerm].status !== 'PAY'){
            return next(new CustomError(400,"The given term for repayment has already been paid for the given loan"));
        }

        //updations
        findRepay.repayments[repaymentTerm].status = "PAID";
        //saving updations 
        await findRepay.save();

        //checking if the loan is completed paid or not 
        if(findLoan.remainingTerm == 1){
            findLoan.status = "PAID";
        }

        //updations
        findLoan.remainingTerm = findLoan.remainingTerm - 1;
        //saving updations. 
        await findLoan.save();

        res.status(200).json({
            success : true,
            message : `Repayment done for term number ${repaymentTerm + 1}`
        })



    }catch(err){
        next(err);
    }
}



