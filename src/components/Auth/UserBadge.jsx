import React from "react";

export default function UserBadge({ session, onLogout }) {
  if (!session?.username) return null;
  return (
    <div className="ml-2 inline-flex items-center gap-2">
      <span className="text-xs opacity-90">{session.username} ({session.role})</span>
      <button
        onClick={onLogout}
        className="px-2 py-0.5 text-[11px] bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded"
        title="Logout"
      >
        Logout
      </button>
    </div>
  );
}

