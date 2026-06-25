import { getRequestHeader as _getRequestHeader } from "@tanstack/react-start/server";
export const getRequestHeader = _getRequestHeader;

export function getClientIp() {
  const forwarded = getRequestHeader("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return getRequestHeader("x-real-ip") || "unknown";
}

export function getOrigin() {
  const proto = getRequestHeader("x-forwarded-proto") || "http";
  const host = getRequestHeader("x-forwarded-host") || getRequestHeader("host") || "localhost:5173";
  return `${proto}://${host}`;
}
