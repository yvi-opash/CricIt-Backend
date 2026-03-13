import { Request, Response } from 'express';
import User from "../model/users.model";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import { AuthRequest } from "../middleware/auth.middleware";
// import Match from '../model/match.model';

export const registercontroller = async (req : Request, res : Response) => {
    try {
        const { username, age, email, phone, password } = req.body;

        if (!username || !age || !email || !phone || !password ) {
      return res.status(400).json({ message: "All fields are required..........." });
        }
        
        const existuser = await User.findOne({$or: [{email}, {phone}]})
        if(existuser){
            return res.status(400).json({message: "User already exists........."})
        }

        const hashedPassword =await bcrypt.hash(password, 5);

        const user = new User({
            username,
            age,
            email,
            phone,
            password: hashedPassword
        });

        await user.save();

            const token = jwt.sign({id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '2d' });
    res.status(200).json({ message: 'User registered successfully......' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}

 
export const logincontroller = async (req: Request, res : Response) =>{
    try {
        const{email, password} = req.body; 

        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({msg : "user not exist....."});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({msg : "invalid email or password........."});
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET || 'secret', { expiresIn: "2d" });

        res.status(200).json({token, message:"user login successyfully"});
    } catch (error) {
         res.status(500).json({ message: 'Server error', error});
    }
}

export const logoutcontroller = async (req: Request , res: Response) => {
    res.status(200).json({ message: 'User logged out successfully' });
}



















