import { db } from "../_helpers/db";
import { Department, DepartmentCreationAttributes } from "./department.model";

export const departmentService = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
};

async function getAll(): Promise<Department[]> {
    return await db.Department.findAll({ order: [["name", "ASC"]] });
}

async function getById(id: number): Promise<Department> {
    return await getDept(id);
}

async function create(params: DepartmentCreationAttributes): Promise<void> {
    const existing = await db.Department.findOne({ where: { name: params.name } });
    if (existing) throw new Error(`Department "${params.name}" already exists`);
    await db.Department.create(params);
}

async function update(id: number, params: Partial<DepartmentCreationAttributes>): Promise<void> {
    const dept = await getDept(id);
    await dept.update(params);
}

async function _delete(id: number): Promise<void> {
    const dept = await getDept(id);
    await dept.destroy();
}

async function getDept(id: number): Promise<Department> {
    const dept = await db.Department.findByPk(id);
    if (!dept) throw new Error("Department not found");
    return dept;
}
