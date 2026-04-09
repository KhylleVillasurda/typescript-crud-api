import config from "../../config.json";
import mysql from "mysql2/promise";
import { Sequelize } from "sequelize";

export interface Database {
    User: any;
    Employee: any;
    Department: any;
    Request: any;
}

export const db: Database = {} as Database;

export async function initialize(): Promise<void> {
    const { host, port, user, password, database } = config.database;

    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.end();

    const sequelize = new Sequelize(database, user, password, {
        host,
        port,
        dialect: "mysql",
        logging: false,
    });

    const { default: userModel }       = await import("../users/user.model");
    const { default: employeeModel }   = await import("../employees/employee.model");
    const { default: departmentModel } = await import("../departments/department.model");
    const { default: requestModel }    = await import("../requests/request.model");

    db.User       = userModel(sequelize);
    db.Employee   = employeeModel(sequelize);
    db.Department = departmentModel(sequelize);
    db.Request    = requestModel(sequelize);

    await sequelize.sync({ alter: true });

    // Seed default admin account
    const adminExists = await db.User.findOne({ where: { email: "admin@example.com" } });
    if (!adminExists) {
        const bcrypt = await import("bcryptjs");
        await db.User.create({
            firstName: "Admin",
            lastName: "User",
            title: "Mr",
            email: "admin@example.com",
            passwordHash: await bcrypt.hash("admin123", 10),
            role: "Admin",
            verified: true,
            verificationToken: null,
        });
        console.log("Seeded default admin — admin@example.com / admin123");
    }

    // Seed default departments
    const deptCount = await db.Department.count();
    if (deptCount === 0) {
        await db.Department.bulkCreate([
            { name: "Engineering", description: "Software team" },
            { name: "HR",          description: "Human Resources" },
        ]);
        console.log("Seeded default departments");
    }

    console.log("Database initialized successfully");
}
