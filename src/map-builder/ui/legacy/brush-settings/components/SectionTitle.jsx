import React from "react";

export default function SectionTitle({ title }) {
  if (!title) {
    return null;
  }
  return <h3 className="font-bold text-sm mb-2">{title}</h3>;
}
