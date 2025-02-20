import User from "../models/user";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import { IUser, OTP } from "../types/models";
import { Request, Response } from "express";
import SendMail from "../utils/sendMail";
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client()

const setAuthTokenCookies = (res: Response, user: IUser) => {
    const token = user.generateToken();
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(Date.now() + parseInt(process.env.JWT_LIFETIME as string) * 1000 * 24 * 60 * 60),
    });
    //to indicate frontend that user is logged in
    res.cookie("userId", user._id, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(
    Date.now() +
    parseInt(process.env.JWT_LIFETIME as string) *
    1000 *
    24 *
    60 *
    60,
    ),
    })
    }
    
    const sendUserData = (user: IUser, res: Response, msg: string) => {
        setAuthTokenCookies(res, user);
        res.status(StatusCodes.CREATED).json({
            data: {
                userId: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                profileImage: user.profileImage,
                myInterests: user.myInterests,
                followingCount: user.following.length,
                followersCount: user.followers.length,
            },
            success: true,
            msg,
        });
    };

    const register = async (req: Request, res: Response) => {
        const { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email || !password) {
            throw new BadRequestError("Please provide all required fields.");
        }
        
        const name = `${firstName} ${lastName}`;
        const userExist = await User.findOne({ email });
        if (userExist) {
            if (userExist.status === "active") {
                return res.status(StatusCodes.CONFLICT).json({ success: false, msg: "User already exists" });
            }
            if (userExist.status === "blocked") {
                return res.status(StatusCodes.FORBIDDEN).json({ success: false, msg: "User is blocked" });
            }
        }


        const otpCode = Math.floor(100000 + Math.random() * 900000);
    const otp: OTP = { value: otpCode.toString(), expires: new Date(Date.now() + 10 * 60 * 1000) };
    
    let user = userExist && userExist.status === "inactive"
        ? await User.findByIdAndUpdate(userExist._id, { name, email, password, otp }, { new: true })
        : await User.create({ name, email, password, status: "inactive", otp });
    
    await SendMail({
        from: process.env.SMTP_EMAIL_USER,
        to: email,
        subject: "Blogmind: Email Verification",
        text: `Your OTP is ${otpCode}`,
        html: `<h1>Your OTP is <strong>${otpCode}</strong></h1>`
    });
    
    res.status(StatusCodes.CREATED).json({ success: true, msg: "OTP sent to email." });
};
   


const forgotPasswordSendOtp = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) throw new BadRequestError("Please provide email.");
    
    const user = await User.findOne({ email });
    if (!user) throw new UnauthenticatedError("Email not registered.");
    
    const otpCode = Math.floor(100000 + Math.random() * 900000);
    user.otp = { value: otpCode.toString(), expires: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save();
    
    await SendMail({
        from: process.env.SMTP_EMAIL_USER,
        to: email,
        subject: "Blogmind: Reset Password",
        text: `Your OTP is ${otpCode}`,
        html: `<h1>Your OTP is <strong>${otpCode}</strong></h1>`
    });
    
    res.status(StatusCodes.CREATED).json({ success: true, msg: "OTP sent to email." });
};




const forgotPasswordVerifyOtp = async (req: Request, res: Response) => {
    const { otp, email, password } = req.body;
    if (!otp || !password) throw new BadRequestError("Please provide OTP and new password.");
    
    const user = await User.findOne({ email, "otp.value": otp });
    if (!user) throw new UnauthenticatedError("Invalid OTP.");
    if (!user.otp || user.otp.expires < new Date()) throw new UnauthenticatedError("OTP expired.");
    
    user.otp = undefined;
    user.password = password;
    
    await user.save();
    
    setAuthTokenCookies(res, user);
    res.status(StatusCodes.CREATED).json({ success: true, msg: "Password changed successfully." });
};


const verifyEmail = async (req: Request, res: Response) => {
    const { otp, userId } = req.body;
    if (!otp) throw new BadRequestError("Please provide OTP.");
    
    const user = await User.findById(userId);
    if (!user || user.otp?.value !== otp) throw new UnauthenticatedError("Invalid OTP.");
    if (!user.otp || user.otp.expires.getTime() < Date.now())
        throw new UnauthenticatedError("OTP expired.");
   

    user.status = "active";
    user.otp = undefined;
    await user.save();
    setAuthTokenCookies(res, user);
    
    res.status(StatusCodes.CREATED).json({ success: true, msg: "User registered successfully." });
};

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email) throw new BadRequestError("Please provide email.");
if (!password) throw new BadRequestError("Please provide password.");

    const user = await User.findOne({ email });
    if (!user) throw new UnauthenticatedError("Email not registered.");
    if (user.status === "inactive") throw new UnauthenticatedError("User is inactive.");
    if (user.status === "blocked") throw new UnauthenticatedError("User is blocked.");
    if (!user.password) throw new UnauthenticatedError("Please login with Google or reset your password.");
    
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) throw new UnauthenticatedError("Invalid credentials.");
    
    setAuthTokenCookies(res, user);
    res.status(StatusCodes.OK).json({ success: true, msg: "User Login Successfully" });
};

const tokenLogin = async (req: Request, res: Response) => {
    const user = await User.findById(req.user.userId);
    if (!user) throw new UnauthenticatedError("User not found.");
    if (user.status === "blocked") throw new UnauthenticatedError("User is blocked.");
    if (user.status === "inactive") throw new UnauthenticatedError("User is inactive.");
    
    sendUserData(user, res, "User Login Successfully");
};

const signOut = async (req: Request, res: Response) => {
    Object.keys(req.cookies).forEach(cookie => res.clearCookie(cookie));
    res.status(StatusCodes.OK).json({ success: true, msg: "User Logout Successfully" });
};

const continueWithGoogle = async (req: Request, res: Response) => {
    const { tokenId } = req.body;
    let payload: any = null;
    
    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch (error) {
        console.log(error);
        throw new BadRequestError("Invalid Token");
    }
    
    const { email, name, picture } = payload;
    let user = await User.findOne({ email });
    
    if (user) {
        if (user.status === "blocked") throw new UnauthenticatedError("User is blocked.");
    } else {
        user = await User.create({ email, name, profileImage: picture, status: "active" });
    }
    
    setAuthTokenCookies(res, user);
    res.status(StatusCodes.CREATED).json({ success: true, msg: "Google Login Successfully" });
};


export {
register,
login,
continueWithGoogle,
verifyEmail,
tokenLogin,
signOut,
forgotPasswordSendOtp,
forgotPasswordVerifyOtp,
}