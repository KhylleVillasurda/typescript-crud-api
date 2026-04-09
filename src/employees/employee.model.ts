import { DataTypes, Model, Optional } from "sequelize";
import { Sequelize } from "sequelize";

export interface EmployeeAttributes {
    id: number;
    userEmail: string;
    position: string;
    department: string;
    hireDate: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface EmployeeCreationAttributes
    extends Optional<EmployeeAttributes, "id" | "createdAt" | "updatedAt"> {}

export class Employee
    extends Model<EmployeeAttributes, EmployeeCreationAttributes>
    implements EmployeeAttributes {

    public id!: number;
    public userEmail!: string;
    public position!: string;
    public department!: string;
    public hireDate!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof Employee {
    Employee.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userEmail: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            position: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            department: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            hireDate: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            modelName: "Employee",
            tableName: "employees",
            timestamps: true,
        }
    );
    return Employee;
}
