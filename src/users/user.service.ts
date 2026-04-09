import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../../config.json";
import { db } from "../_helpers/db";
import { Role } from "../_helpers/role";
import { User, UserCreationAttributes } from "./user.model";

export const userService = {
    authenticate,
    register,
    verifyEmail,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
};

// ── Public auth ──────────────────────────────────────────────────────────────

async function authenticate(
    email: string,
    password: string
): Promise<{ token: string } & Omit<UserCreationAttributes, "passwordHash" | "verificationToken">> {
    const user = await db.User.scope("withHash").findOne({ where: { email } });

    if (!user) throw new Error("Email or password is incorrect");
    if (!user.verified) throw new Error("Email not verified — please verify your account first");

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new Error("Email or password is incorrect");

    const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        config.jwtSecret,
        { expiresIn: "7d" }
    );

    const { passwordHash, verificationToken, ...userInfo } = user.toJSON() as any;
    return { ...userInfo, token };
}

async function register(params: {
    firstName: string;
    lastName: string;
    title?: string;
    email: string;
    password: string;
}): Promise<{ verificationToken: string }> {
    const existing = await db.User.findOne({ where: { email: params.email } });
    if (existing) throw new Error(`Email "${params.email}" is already registered`);

    const passwordHash = await bcrypt.hash(params.password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await db.User.create({
        firstName: params.firstName,
        lastName: params.lastName,
        title: params.title || "",
        email: params.email,
        passwordHash,
        role: Role.User,
        verified: false,
        verificationToken,
    } as UserCreationAttributes);

    // In production you'd email this token. We return it for the demo simulation.
    return { verificationToken };
}

async function verifyEmail(token: string): Promise<void> {
    const user = await db.User.scope("withHash").findOne({
        where: { verificationToken: token },
    });
    if (!user) throw new Error("Invalid or expired verification token");

    await user.update({ verified: true, verificationToken: null });
}

// ── Admin CRUD ───────────────────────────────────────────────────────────────

async function getAll(): Promise<User[]> {
    return await db.User.findAll();
}

async function getById(id: number): Promise<User> {
    return await getUser(id);
}

async function create(
    params: UserCreationAttributes & { password: string; confirmPassword?: string }
): Promise<void> {
    const existing = await db.User.findOne({ where: { email: params.email } });
    if (existing) throw new Error(`Email "${params.email}" is already registered`);

    const passwordHash = await bcrypt.hash(params.password, 10);

    await db.User.create({
        ...params,
        passwordHash,
        role: params.role || Role.User,
        verified: params.verified ?? true, // Admin-created accounts skip verification
        verificationToken: null,
    } as UserCreationAttributes);
}

async function update(
    id: number,
    params: Partial<UserCreationAttributes> & { password?: string; confirmPassword?: string }
): Promise<void> {
    const user = await getUser(id);

    const updateData: Record<string, unknown> = { ...params };
    delete updateData["confirmPassword"];

    if (params.password) {
        updateData["passwordHash"] = await bcrypt.hash(params.password, 10);
        delete updateData["password"];
    }

    await user.update(updateData as Partial<UserCreationAttributes>);
}

async function _delete(id: number): Promise<void> {
    const user = await getUser(id);
    await user.destroy();
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getUser(id: number): Promise<User> {
    const user = await db.User.scope("withHash").findByPk(id);
    if (!user) throw new Error("User not found");
    return user;
}
