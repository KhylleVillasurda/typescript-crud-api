import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import Joi from "joi";
import { Role } from "../_helpers/role";
import { validateRequest } from "../_middleware/validateRequest";
import { authorize, AuthRequest } from "../_middleware/authorize";
import { userService } from "./user.service";

const router = Router();

// Public routes
router.post("/authenticate", authenticateSchema, authenticate);
router.post("/register",     registerSchema,     register);
router.post("/verify-email", verifyEmail);

// Admin-only routes
router.get("/",      authorize([Role.Admin]),            getAll);
router.get("/:id",   authorize([Role.Admin]),            getById);
router.post("/",     authorize([Role.Admin]), createSchema, create);
router.put("/:id",   authorize([Role.Admin]), updateSchema, update);
router.delete("/:id",authorize([Role.Admin]),            _delete);

export default router;

// ── Handlers ─────────────────────────────────────────────────────────────────

function authenticate(req: Request, res: Response, next: NextFunction): void {
    userService.authenticate(req.body.email, req.body.password)
        .then((result) => res.json(result))
        .catch(next);
}

function register(req: Request, res: Response, next: NextFunction): void {
    userService.register(req.body)
        .then((result) => res.json({ message: "Registration successful", ...result }))
        .catch(next);
}

function verifyEmail(req: Request, res: Response, next: NextFunction): void {
    const { token } = req.body;
    if (!token) { res.status(400).json({ message: "Token is required" }); return; }
    userService.verifyEmail(token)
        .then(() => res.json({ message: "Email verified successfully" }))
        .catch(next);
}

function getAll(req: Request, res: Response, next: NextFunction): void {
    userService.getAll()
        .then((users) => res.json(users))
        .catch(next);
}

function getById(req: Request, res: Response, next: NextFunction): void {
    userService.getById(Number(req.params.id))
        .then((user) => res.json(user))
        .catch(next);
}

function create(req: Request, res: Response, next: NextFunction): void {
    userService.create(req.body)
        .then(() => res.json({ message: "User created" }))
        .catch(next);
}

function update(req: Request, res: Response, next: NextFunction): void {
    userService.update(Number(req.params.id), req.body)
        .then(() => res.json({ message: "User updated" }))
        .catch(next);
}

function _delete(req: Request, res: Response, next: NextFunction): void {
    userService.delete(Number(req.params.id))
        .then(() => res.json({ message: "User deleted" }))
        .catch(next);
}

// ── Validation schemas ────────────────────────────────────────────────────────

function authenticateSchema(req: Request, res: Response, next: NextFunction): void {
    const schema = Joi.object({
        email:    Joi.string().email().required(),
        password: Joi.string().required(),
    });
    validateRequest(req, next, schema);
}

function registerSchema(req: Request, res: Response, next: NextFunction): void {
    const schema = Joi.object({
        title:           Joi.string().empty(""),
        firstName:       Joi.string().required(),
        lastName:        Joi.string().required(),
        email:           Joi.string().email().required(),
        password:        Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref("password")).required()
            .messages({ "any.only": "Passwords do not match" }),
    });
    validateRequest(req, next, schema);
}

function createSchema(req: Request, res: Response, next: NextFunction): void {
    const schema = Joi.object({
        title:           Joi.string().empty(""),
        firstName:       Joi.string().required(),
        lastName:        Joi.string().required(),
        role:            Joi.string().valid(Role.Admin, Role.User).default(Role.User),
        email:           Joi.string().email().required(),
        password:        Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
        verified:        Joi.boolean().default(true),
    });
    validateRequest(req, next, schema);
}

function updateSchema(req: Request, res: Response, next: NextFunction): void {
    const schema = Joi.object({
        title:           Joi.string().empty(""),
        firstName:       Joi.string().empty(""),
        lastName:        Joi.string().empty(""),
        role:            Joi.string().valid(Role.Admin, Role.User).empty(""),
        email:           Joi.string().email().empty(""),
        password:        Joi.string().min(6).empty(""),
        confirmPassword: Joi.string().valid(Joi.ref("password")).empty(""),
        verified:        Joi.boolean(),
    }).with("password", "confirmPassword");
    validateRequest(req, next, schema);
}
