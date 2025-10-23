import { RequestUser } from "src/common/interfaces/request-user.interface";
import { LoginDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";
import { RequestDto } from "../dto/request.dto";
import { VerifyOtpDto } from "../dto/verify.dto";
import { IAuthResponse } from "./auth-response.interface";
import { Response, Request } from "express";

export interface IAuthService {
    requestOtp(data: RequestDto): Promise<Object>;
    verifyOtp(data: VerifyOtpDto): Promise<Object>;
    login(data: LoginDto, res: Response): Promise<IAuthResponse>;
    register(data: RegisterDto): Promise<IAuthResponse>;
    logout(userId: number, Res: Response);
}