import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import Joi from "joi";
import { Role } from "../_helpers/role";
import { validateRequest } from "../_middleware/validateRequest";
import { authorize } from "../_middleware/authorize";
import { employeeService } from "./employee.service";

const router = Router();

router.get("/",      authorize([Role.Admin]),              getAll);
router.get("/:id",   authorize([Role.Admin]),              getById);
router.post("/",     authorize([Role.Admin]), createSchema, create);
router.put("/:id",   authorize([Role.Admin]), updateSchema, update);
router.delete("/:id",authorize([Role.Admin]),              _delete);

export default router;

function getAll(req: Request, res: Response, next: NextFunction): void {
    employeeService.getAll()
        .then((emps) => res.json(emps))
        .catch(next);
}

function getById(req: Request, res: Response, next: NextFunction): void {
    employeeService.getById(Number(req.params.id))
        .then((emp) => res.json(emp))
        .catch(next);
}

function create(req: Request, res: Response, next: NextFunction): void {
    employeeService.create(req.body)
        .then(() => res.json({ message: "Employee created" }))
        .catch(next);
}

function update(req: Request, res: Response, next: NextFunction): void {
    employeeService.update(Number(req.params.id), req.body)
        .then(() => res.json({ message: "Employee updated" }))
        .catch(next);
}

function _delete(req: Request, res: Response, next: NextFunction): void {
    employeeService.delete(Number(req.params.id))
        .then(() => res.json({ message: "Employee deleted" }))
        .catch(next);
}

function createSchema(req: Request, res: Response, next: NextFunction): void {
    const schema = Joi.object({
        userEmail:  Joi.string().email().required(),
        position:   Joi.string().required(),
        department: Joi.string().required(),
        hireDate:   Joi.string().isoDate().required(),
    });
    validateRequest(req, next, schema);
}

function updateSchema(req: Request, res: Response, next: NextFunction): void {
    const schema = Joi.object({
        userEmail:  Joi.string().email().empty(""),
        position:   Joi.string().empty(""),
        department: Joi.string().empty(""),
        hireDate:   Joi.string().isoDate().empty(""),
    });
    validateRequest(req, next, schema);
}
