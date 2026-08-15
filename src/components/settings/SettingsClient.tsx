"use client";

import { useState } from "react";
import { ShieldCheck, User, ToggleLeft, ToggleRight, History, Activity } from "lucide-react";
import { toggleUserActiveAction } from "@/lib/actions";

export function SettingsClient({
  users,
  auditLogs,
}: {
  users: Array<any>;
  auditLogs: Array<any>;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleToggleUser(userId: string, currentActive: boolean) {
    setLoadingId(userId);
    try {
      await toggleUserActiveAction(userId, !currentActive);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#20231f]">System Settings & Audit Log</h1>
        <p className="mt-1 text-sm text-[#6b746c]">
          Manage internal system users, permissions, and view audit history.
        </p>
      </div>

      {/* Internal User Accounts */}
      <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm space-y-4 p-5">
        <div className="flex items-center gap-2 border-b border-[#edf1e8] pb-3">
          <ShieldCheck className="size-4 text-[#3f563f]" />
          <h2 className="text-sm font-bold text-[#20231f]">Internal System Accounts</h2>
        </div>

        <div className="divide-y divide-[#edf1e8]">
          {users.map((u) => (
            <div key={u.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-[#edf1e8] font-bold text-[#3f563f]">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[#20231f]">{u.name}</p>
                  <p className="text-[#6b746c]">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-900">
                  {u.role}
                </span>

                <button
                  disabled={loadingId === u.id}
                  onClick={() => handleToggleUser(u.id, u.isActive)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    u.isActive
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {u.isActive ? "ACTIVE" : "INACTIVE"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-xl border border-[#d8ded2] bg-white shadow-sm">
        <div className="p-4 border-b border-[#edf1e8] bg-[#f8faf6] flex items-center gap-2">
          <History className="size-4 text-[#3f563f]" />
          <h2 className="text-sm font-bold text-[#20231f]">System Audit Trail</h2>
        </div>
        {auditLogs.length === 0 ? (
          <div className="p-12 text-center text-[#6b746c] text-sm">No audit logs recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#edf1e8] bg-[#f8faf6] text-xs font-semibold uppercase tracking-wider text-[#5f685e]">
                <tr>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Entity</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1e8]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fbfcf9]">
                    <td className="px-6 py-4 font-semibold text-[#20231f]">
                      {log.actor?.name || "System"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-[#edf1e8] px-2 py-0.5 text-xs font-mono font-semibold text-[#3f563f]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-[#4e584f]">
                      {log.entityType} ({log.entityId})
                    </td>
                    <td className="px-6 py-4 text-xs text-[#4e584f]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
