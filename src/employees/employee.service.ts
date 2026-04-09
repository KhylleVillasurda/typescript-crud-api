import { db } from "../_helpers/db";
import { Employee, EmployeeCreationAttributes } from "./employee.model";

export const employeeService = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
};

async function getAll(): Promise<Employee[]> {
    return await db.Employee.findAll({ order: [["id", "ASC"]] });
}

async function getById(id: number): Promise<Employee> {
    return await getEmp(id);
}

async function create(params: EmployeeCreationAttributes): Promise<void> {
    const existing = await db.Employee.findOne({ where: { userEmail: params.userEmail } });
    if (existing) throw new Error(`Employee with email "${params.userEmail}" already exists`);
    await db.Employee.create(params);
}

async function update(id: number, params: Partial<EmployeeCreationAttributes>): Promise<void> {
    const emp = await getEmp(id);
    await emp.update(params);
}

async function _delete(id: number): Promise<void> {
    const emp = await getEmp(id);
    await emp.destroy();
}

async function getEmp(id: number): Promise<Employee> {
    const emp = await db.Employee.findByPk(id);
    if (!emp) throw new Error("Employee not found");
    return emp;
}
