import { LoginDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";
import { RequestDto } from "../dto/request.dto";
import { VerifyOtpDto } from "../dto/verify.dto";
import { IAuthResponse } from "./auth-response.interface";
import { Response } from "express";

export interface IAuthService {
    requestOtp(data: RequestDto): Promise<Object>;
    verifyOtp(data: VerifyOtpDto): Promise<Object>;
    login(data: LoginDto, res: Response): Promise<IAuthResponse>;
    register(data: RegisterDto): Promise<IAuthResponse>;
    logout(): Promise<Object>;
}