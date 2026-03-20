import { prisma } from "./prisma";

export async function logAction(
    action: string,
    entity: string,
    entityId? : string,
    userId?: string,
    meta? : object
) {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                userId,
                meta,
            },
        });
    } catch (err) {
        //Never let audit logging break the main request
        console.error("Audit log failed", err);
    }
}