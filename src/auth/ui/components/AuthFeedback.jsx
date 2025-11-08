import React from "react";

export function AuthFeedback({ feedback }) {
  if (!feedback?.message) return null;
  const tone = feedback.type === "error" ? "text-red-400" : "text-green-400";
  return <div className={`${tone} text-xs`}>{feedback.message}</div>;
}
