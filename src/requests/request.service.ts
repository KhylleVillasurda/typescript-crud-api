import { db } from "../_helpers/db";
import { UserRequest, RequestCreationAttributes } from "./request.model";

export const requestService = {
    getAllByUser,
    getAll,
    create,
    updateStatus,
    delete: _delete,
};

async function getAllByUser(userEmail: string): Promise<UserRequest[]> {
    return await db.Request.findAll({
        where: { userEmail },
        order: [["createdAt", "DESC"]],
    });
}

async function getAll(): Promise<UserRequest[]> {
    return await db.Request.findAll({ order: [["createdAt", "DESC"]] });
}

async function create(params: RequestCreationAttributes): Promise<void> {
    await db.Request.create({ ...params, status: "Pending" });
}

async function updateStatus(id: number, status: string): Promise<void> {
    const req = await getReq(id);
    await req.update({ status });
}

async function _delete(id: number): Promise<void> {
    const req = await getReq(id);
    await req.destroy();
}

async function getReq(id: number): Promise<UserRequest> {
    const req = await db.Request.findByPk(id);
    if (!req) throw new Error("Request not found");
    return req;
}
