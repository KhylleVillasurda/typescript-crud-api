import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import Joi from "joi";
import { Role } from "../_helpers/role";
import { validateRequest } from "../_middleware/validateRequest";
import { authorize } from "../_middleware/authorize";
import { departmentService } from "./department.service";

const router = Router();

// Any authenticated user can view departments (needed for employee form dropdown)
router.get("/",      authorize(),              getAll);
router.get("/:id",   authorize(),              getById);
// Only admins can mutate
router.post("/",     authorize([Role.Admin]), createSchema, create);
router.put("/:id",   authorize([Role.Admin]), updateSchema, update);
router.delete("/:id",authorize([Role.Admin]),              _delete);

export default router;

function getAll(req: Request, res: Response, next: NextFunction): void {
    departmentService.getAll()
        .then((depts) => res.json(depts))
        .catch(next);
}

function getById(req: Request, res: Response, next: NextFunction): void {
    departmentService.getById(Number(req.params.id))
        .then((dept) => res.json(dept))
        .catch(next);
}

function create(req: Request, res: Response, next: NextFunction): void {
    departmentService.create(req.body)
        .then(() => res.json({ message: "Department created" }))
        .catch(next);
}

function update(req: Request, res: Response, next: NextFunction): void {
    departmentService.update(Number(req.params.id), req.body)
        .then(() => res.json({ message: "Department updated" }))
        .catch(next);
}

function _delete(req: Request, res: Response, next: NextFunction): void {
    departmentService.delete(Number(req.params.id))
        .then(() => res.json({ message: "Department deleted" }))
        .catch(next);
}

function createSchema(req: Request, res: Response, next: NextFunction): void {
    const schema = Joi.object({
        name:        Joi.string().required(),
        description: Joi.string().required(),
    });
    validateRequest(req, next, schema);
}

function updateSchema(req: Request, res: Response, next: NextFunction): void {
    const schema = Joi.object({
        name:        Joi.string().empty(""),
        description: Joi.string().empty(""),
    });
    validateRequest(req, next, schema);
}
