import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../config/supabase";

interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    userId: string | null;
    meta: Record<string, any> | null;
    createdAt: string;
}

//Maps actions + entity to a human readable message and icon
function formatEvent(log: AuditLog): { message: string; icon: string; color: string } {
    const entity = log.entity.toLowerCase();
    switch (log.action) {
        case "CREATE":
            return {
                message: `New ${entity} created`,
                icon: "✨",
                color: "#00e5b0",
            };
        case "UPDATE":
            return {
                message: `${entity} updated`,
                icon: "✏️",
                color: "#ffd166",
            };
        case "DELETE":
            return {
                message: `${entity} deleted`,
                icon: "🗑️",
                color: "#ff6b6b",
            };
        default:
            return {
                message: `${log.action} on ${entity}`,
                icon: "📋",
                color: "6b7694",
            };
    }
}

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
}

export default function LiveActivityFeed() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        //Fetch the last 10 logs on mount
        //WHY: Realtime only gives us new events. Without this initial fetch, the feed would be empty until the first action happens.
        const fetchInitial = async () => {
            const { data } = await supabase
                .from("Auditlog")
                .select("*")
                .order("createdAt", { ascending: false })
                .limit(10);
            if (data) setLogs(data.reverse());
        };
        fetchInitial();

        //Subscrirbe to new AuditLog rows
        const channel = supabase
            .channel("audit-log-feed")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "AuditLog" },
                (payload) => {
                    const newLog = payload.new as AuditLog;
                    setLogs((prev) => {
                        //Keep max 20 entries, newest at bottom
                        const updated = [...prev, newLog];
                        return updated.slice(-20);
                    });
                }
            )
            .subscribe((status) => {
                setConnected(status === "SUBSCRIBED");
            })
    })
}