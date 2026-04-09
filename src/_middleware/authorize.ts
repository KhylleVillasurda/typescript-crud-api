import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../../config.json";

export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
        email: string;
    };
}

/**
 * Middleware factory. Pass an array of allowed roles, or leave empty to
 * allow any authenticated user.
 *
 * Usage:
 *   router.get("/", authorize(), handler)              // any authenticated user
 *   router.delete("/:id", authorize(["Admin"]), handler) // admin only
 */
export function authorize(roles: string[] = []) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            res.status(401).json({ message: "Unauthorized — no token provided" });
            return;
        }

        const token = authHeader.split(" ")[1];

        try {
            const decoded = jwt.verify(token, config.jwtSecret) as {
                id: number;
                role: string;
                email: string;
            };

            if (roles.length && !roles.includes(decoded.role)) {
                res.status(403).json({ message: "Forbidden — insufficient role" });
                return;
            }

            req.user = decoded;
            next();
        } catch {
            res.status(401).json({ message: "Unauthorized — invalid or expired token" });
        }
    };
}
