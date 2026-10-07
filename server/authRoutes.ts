import type { Request, Response } from "express";
import { authService } from "./authService";
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema, 
  changePasswordSchema 
} from "../shared/schema";

// Register new user
export async function register(req: Request, res: Response) {
  try {
    const validationResult = registerSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation Error",
        details: validationResult.error.errors,
      });
    }

    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    const result = await authService.register(validationResult.data, ipAddress, userAgent);

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please check your email for verification.",
      data: result,
    });
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: "Conflict",
          message: error.message,
        });
      }
    }

    res.status(500).json({
      error: "Registration Failed",
      message: "Failed to register user. Please try again.",
    });
  }
}

// Login user
export async function login(req: Request, res: Response) {
  try {
    const validationResult = loginSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation Error",
        details: validationResult.error.errors,
      });
    }

    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    const result = await authService.login(validationResult.data, ipAddress, userAgent);

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Login error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid email or password')) {
        return res.status(401).json({
          error: "Authentication Failed",
          message: "Invalid email or password",
        });
      }
    }

    res.status(500).json({
      error: "Login Failed",
      message: "Failed to login. Please try again.",
    });
  }
}

// Refresh tokens
export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Refresh token is required",
      });
    }

    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    const result = await authService.refreshToken(refreshToken, ipAddress, userAgent);

    res.json({
      success: true,
      message: "Tokens refreshed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid or expired')) {
        return res.status(401).json({
          error: "Authentication Failed",
          message: "Invalid or expired refresh token",
        });
      }
    }

    res.status(500).json({
      error: "Token Refresh Failed",
      message: "Failed to refresh tokens. Please login again.",
    });
  }
}

// Logout user
export async function logout(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Access token is required",
      });
    }

    const token = authHeader.substring(7);
    await authService.logout(token);

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Logout Failed",
      message: "Failed to logout. Please try again.",
    });
  }
}

// Logout from all devices
export async function logoutAll(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    await authService.logoutAll(req.user.id);

    res.json({
      success: true,
      message: "Logged out from all devices successfully",
    });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      error: "Logout Failed",
      message: "Failed to logout from all devices. Please try again.",
    });
  }
}

// Forgot password
export async function forgotPassword(req: Request, res: Response) {
  try {
    const validationResult = forgotPasswordSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation Error",
        details: validationResult.error.errors,
      });
    }

    await authService.forgotPassword(validationResult.data);

    res.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      error: "Request Failed",
      message: "Failed to process password reset request. Please try again.",
    });
  }
}

// Reset password
export async function resetPassword(req: Request, res: Response) {
  try {
    const validationResult = resetPasswordSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation Error",
        details: validationResult.error.errors,
      });
    }

    await authService.resetPassword(validationResult.data);

    res.json({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid or expired')) {
        return res.status(400).json({
          error: "Bad Request",
          message: error.message,
        });
      }
    }

    res.status(500).json({
      error: "Reset Failed",
      message: "Failed to reset password. Please try again.",
    });
  }
}

// Change password
export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    const validationResult = changePasswordSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation Error",
        details: validationResult.error.errors,
      });
    }

    await authService.changePassword(req.user.id, validationResult.data);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('Current password is incorrect')) {
        return res.status(400).json({
          error: "Bad Request",
          message: error.message,
        });
      }
    }

    res.status(500).json({
      error: "Change Failed",
      message: "Failed to change password. Please try again.",
    });
  }
}

// Get user profile
export async function getProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    // In a real implementation, you would fetch user details from database
    // For now, we'll return the basic user info from the token
    res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        // Add other user fields as needed
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Profile Fetch Failed",
      message: "Failed to fetch user profile. Please try again.",
    });
  }
}

// Get user sessions
export async function getSessions(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    const sessions = await authService.getUserSessions(req.user.id);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({
      error: "Sessions Fetch Failed",
      message: "Failed to fetch user sessions. Please try again.",
    });
  }
}

// Verify email
export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        error: "Bad Request",
        message: "Verification token is required",
      });
    }

    // In a real implementation, you would verify the email token
    // For now, we'll return a success message
    
    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      error: "Verification Failed",
      message: "Failed to verify email. Please try again.",
    });
  }
}
