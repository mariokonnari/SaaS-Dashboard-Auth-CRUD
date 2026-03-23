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
    const date = new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z")
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
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
                .from("AuditLog")
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
            });

            //Cleanup on unmount
            //WHY: Without this, navigating away leaves an active WebSocket subscription running in the background - memory leak
            return () => {
                supabase.removeChannel(channel);
            };
    },[]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-6 border border-white/7"
            style={{ background: "#111624" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-base font-bold text-white">Live Activity Feed</h3>
                    <p className="text-sm text-[#6b7694]">Real-time system events</p>
                </div>
                {/* Connection status indicator */}
                <div className="flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{
                            background: connected ? "#00e5b0" : "#ff6b6b",
                            boxShadow: connected ? "0 0 6px #00e55b0" : "none",
                        }}
                    />
                    <span className="text-xs text-[#6b7694]">
                        {connected ? "Live" : "Connecting..."}
                    </span>
                </div>
            </div>

            {/* Feed */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {logs.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-3xl mb-2">📡</p>
                        <p className="text-[#6b7694] text-sm">Waiting for activity...</p>
                    </div>
                ): (
                    <AnimatePresence initial={false}>
                        {logs.map((log) => {
                            const { message, icon, color } = formatEvent(log);
                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -12, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5"
                                >
                                    <span className="text-lg flex-shrink-0">{icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium" style={{ color }}>
                                            {message}
                                        </p>
                                        {log.entityId && (
                                            <p className="text-xs text-[#6b7694] font-mono truncate">
                                                ID: {log.entity.slice(0, 16)}...
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs text-[#6b7694] flex-shrink-0">
                                        {timeAgo(log.createdAt)}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
}