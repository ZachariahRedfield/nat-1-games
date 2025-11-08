import React from "react";

export function AuthRoleSelect({ role, onChange }) {
  return (
    <label className="text-xs block">
      Role
      <select
        className="w-full p-2 mt-1 rounded bg-gray-700 border border-gray-600"
        value={role}
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option>Player</option>
        <option>DM</option>
      </select>
    </label>
  );
}
