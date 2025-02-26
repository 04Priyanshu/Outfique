import { prisma } from "../server";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {v4 as uuidv4} from "uuid";

function generateToken(userId:string,email:string, role:string) {
    const acessToken = jwt.sign({userId,email,role}, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: "15m"});
    const refreshToken = uuidv4();
    return {acessToken, refreshToken};
}

async function setTokens(res:Response, acessToken:string, refreshToken:string) {
    res.cookie('acessToken', acessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60*60*1000
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7*24*60*60
    });
}

export const register = async (req: Request, res: Response) : Promise<void> => {
    try {

        const {name, email, password} = req.body;

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if (existingUser) {
         res.status(400).json({sucess: false, error: "User already exists!!"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role:"USER"
            }
        });

        res.status(201).json({sucess: true, userId:user.id , message: "User registered successfully"});
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Registration failed" });
        
    }
}

export const login = async (req: Request, res: Response) : Promise<void> => {
    try {

        const {email, password} = req.body;
        const extractCurrentUser = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (!extractCurrentUser || !(await bcrypt.compare(password, extractCurrentUser.password))) {
            res.status(401).json({sucess: false, error: "Invalid credentials"});
            return;
        }

        //create our acess token and refresh token
        const {acessToken, refreshToken} = generateToken(extractCurrentUser.id, extractCurrentUser.email, extractCurrentUser.role);
        

        //set our token
        setTokens(res, acessToken, refreshToken);
        res.status(200).json({
            sucess: true,
            message: "Login successful",
            user:{
                id: extractCurrentUser.id,
                name: extractCurrentUser.name,
                email: extractCurrentUser.email,
                role: extractCurrentUser.role
            }
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Login failed" });
        
    }


}

export const refreshToken = async (req: Request, res: Response):Promise<void>=> {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        res.status(401).json({sucess: false, error: "invalid token"});
        return;
    }
    try {
        const user= await prisma.user.findUnique({
            where :{refreshToken : refreshToken}
        });

        if (!user) {
            res.status(401).json({sucess: false, error: "User not found"});
            return;
        }

        const {acessToken, refreshToken: newRefreshToken} = generateToken(user.id, user.email, user.role);
        await setTokens(res, acessToken, newRefreshToken);
        res.status(200).json({sucess: true, message: "Token refreshed"});

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Token refresh failed" });
        
    }
};

export const logout = async (req: Request, res: Response):Promise<void> => {
    res.clearCookie('acessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({sucess: true, message: "Logout successful"});
}