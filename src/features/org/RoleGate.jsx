import React from "react";
import { useAppStore } from "../../store/app";

export default function RoleGate({ allow, children, fallback = null }) {
  const role = useAppStore((s) => s.role);
  return allow.includes(role) ? children : fallback;
}
