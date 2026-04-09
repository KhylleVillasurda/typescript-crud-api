import { DataTypes, Model, Optional } from "sequelize";
import { Sequelize } from "sequelize";

export interface UserAttributes {
    id: number;
    email: string;
    passwordHash: string;
    title: string;
    firstName: string;
    lastName: string;
    role: string;
    verified: boolean;
    verificationToken: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserCreationAttributes
    extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt"> {}

export class User
    extends Model<UserAttributes, UserCreationAttributes>
    implements UserAttributes {

    public id!: number;
    public email!: string;
    public passwordHash!: string;
    public title!: string;
    public firstName!: string;
    public lastName!: string;
    public role!: string;
    public verified!: boolean;
    public verificationToken!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof User {
    User.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            passwordHash: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "",
            },
            firstName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            role: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            verified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            verificationToken: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: null,
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
            modelName: "User",
            tableName: "users",
            timestamps: true,
            defaultScope: {
                attributes: { exclude: ["passwordHash", "verificationToken"] },
            },
            scopes: {
                withHash: {
                    attributes: { include: ["passwordHash", "verificationToken"] },
                },
            },
        }
    );
    return User;
}
