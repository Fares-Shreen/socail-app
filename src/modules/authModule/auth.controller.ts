import express from "express"
import authService from "./auth.service"
import validation from "../../common/middleware/validation"
import { confirmOtpSchema, forgetPasswordSchema, logoutSchema, resendOtpSchema, resetPasswordSchema, signInSchema, signUpSchema, signUpWithGoogleSchema, updatePasswordSchema } from "./auth.validation"
import isAuthorized from "../../common/middleware/authorization"
import isAthenticated from "../../common/middleware/authentication"
import { roleEnum } from "../../common/enum/enum"


const authRouter = express.Router()

authRouter.post("/signUp",validation(signUpSchema),authService.signUp)
authRouter.post("/resendOtpSignUp",validation(resendOtpSchema), authService.resendOtpSignUp)
authRouter.post("/confirmSignUp",validation(confirmOtpSchema), authService.confirmSignUp)
authRouter.post("/signIn",validation(signInSchema),authService.signIn)
authRouter.post("/resendOtpSignIn",validation(resendOtpSchema),authService.resendOtpSignIn)
authRouter.post("/confirmSignIn",validation(confirmOtpSchema),authService.confirmSignIn)
authRouter.post("/signUpWithGoogle",validation(signUpWithGoogleSchema),authService.signUpWithGoogle)
authRouter.post("/updatePaswword", validation(updatePasswordSchema), isAthenticated,isAuthorized([roleEnum.admin,roleEnum.user]),authService.updatePaswword)
authRouter.post("/forgetPssword",validation(forgetPasswordSchema),authService.forgetPssword)
authRouter.post("/resendForgetPasswordOtp",validation(resendOtpSchema),authService.resendForgetPasswordOtp)
authRouter.post("/confirmForegtPasswordOtp",validation(resetPasswordSchema),authService.confirmForegtPasswordOtp)
authRouter.post("/logout", validation(logoutSchema), isAthenticated, isAuthorized([roleEnum.admin, roleEnum.user]),authService.logout)
authRouter.post("/refreshToken", authService.refreshToke)



export default authRouter