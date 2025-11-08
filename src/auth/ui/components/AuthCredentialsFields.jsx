import React from "react";

export function AuthCredentialsFields({
  username,
  password,
  onUsernameChange,
  onPasswordChange,
}) {
  return (
    <>
      <label className="text-xs block">
        Username
        <input
          className="w-full p-2 mt-1 rounded bg-gray-700 border border-gray-600"
          value={username}
          onChange={(event) => onUsernameChange?.(event.target.value)}
        />
      </label>
      <label className="text-xs block">
        Password
        <input
          type="password"
          className="w-full p-2 mt-1 rounded bg-gray-700 border border-gray-600"
          value={password}
          onChange={(event) => onPasswordChange?.(event.target.value)}
        />
      </label>
    </>
  );
}
