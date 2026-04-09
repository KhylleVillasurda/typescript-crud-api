import { DataTypes, Model, Optional } from "sequelize";
import { Sequelize } from "sequelize";

export interface RequestItem {
    name: string;
    qty: number;
}

export interface RequestAttributes {
    id: number;
    userEmail: string;
    type: string;
    items: RequestItem[];
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface RequestCreationAttributes
    extends Optional<RequestAttributes, "id" | "status" | "createdAt" | "updatedAt"> {}

export class UserRequest
    extends Model<RequestAttributes, RequestCreationAttributes>
    implements RequestAttributes {

    public id!: number;
    public userEmail!: string;
    public type!: string;
    public items!: RequestItem[];
    public status!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof UserRequest {
    UserRequest.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userEmail: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            items: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: [],
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "Pending",
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
            modelName: "UserRequest",
            tableName: "requests",
            timestamps: true,
        }
    );
    return UserRequest;
}
