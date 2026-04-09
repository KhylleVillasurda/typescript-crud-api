import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import Joi from "joi";
import { Role } from "../_helpers/role";
import { validateRequest } from "../_middleware/validateRequest";
import { authorize, AuthRequest } from "../_middleware/authorize";
import { requestService } from "./request.service";

const router = Router();

// Any authenticated user can fetch their own requests and create new ones
router.get("/",         authorize(), getRequests);
router.post("/",        authorize(), createSchema, create);
// Admin-only: update status or delete any request
router.put("/:id",      authorize([Role.Admin]), updateStatusSchema, updateStatus);
router.delete("/:id",   authorize([Role.Admin]),                     _delete);

export default router;

function getRequests(req: AuthRequest, res: Response, next: NextFunction): void {
    const user = req.user!;
    // Admins see all; regular users see only their own
    const fetcher = user.role === Role.Admin
        ? requestService.getAll()
        : requestService.getAllByUser(user.email);

    fetcher.then((items) => res.json(items)).catch(next);
}

function create(req: AuthRequest, res: Response, next: NextFunction): void {
    const payload = { ...req.body, userEmail: req.user!.email };
    requestService.create(payload)
        .then(() => res.json({ message: "Request submitted" }))
        .catch(next);
}

function updateStatus(req: Request, res: Response, next: NextFunction): void {
    requestService.updateStatus(Number(req.params.id), req.body.status)
        .then(() => res.json({ message: "Status updated" }))
        .catch(next);
}

function _delete(req: Request, res: Response, next: NextFunction): void {
    requestService.delete(Number(req.params.id))
        .then(() => res.json({ message: "Request deleted" }))
        .catch(next);
}

function createSchema(req: Request, res: Response, next: NextFunction): void {
    const schema = Joi.object({
        type: Joi.string().valid("Equipment", "Leave", "Resources").required(),
        items: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                qty:  Joi.number().integer().min(1).required(),
            })
        ).min(1).required(),
    });
    validateRequest(req, next, schema);
}

function updateStatusSchema(req: Request, res: Response, next: NextFunction): void {
    const schema = Joi.object({
        status: Joi.string().valid("Pending", "Approved", "Rejected").required(),
    });
    validateRequest(req, next, schema);
}
