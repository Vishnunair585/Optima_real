import { asc, desc, eq, lt, gt, and, type SQL, type Column } from "drizzle-orm";
import type { AnyColumn, GetColumnData } from "drizzle-orm";
import { getDb } from "./connection";

export type CursorDirection = "before" | "after";
export type CursorOrder = "asc" | "desc";

export interface CursorPaginationParams {
  cursor?: string;
  direction?: CursorDirection;
  limit?: number;
  order?: CursorOrder;
}

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalCount?: number;
}

function encodeCursor(value: unknown): string {
  return Buffer.from(String(value)).toString("base64url");
}

function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64url").toString("utf-8");
}

export function buildCursorQuery<T extends Record<string, unknown>>(
  baseWhere: SQL | undefined,
  cursorColumn: AnyColumn,
  params: CursorPaginationParams,
  additionalOrder?: { column: AnyColumn; dir: CursorOrder }[],
) {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const order = params.order ?? "desc";
  const dir = params.direction ?? "after";

  let where = baseWhere;

  if (params.cursor) {
    const cursorVal = decodeCursor(params.cursor);
    const cmp = dir === "after" ? (order === "desc" ? lt : gt) : (order === "desc" ? gt : lt);
    where = where ? and(where, cmp(cursorColumn, cursorVal)) : cmp(cursorColumn, cursorVal);
  }

  const orderFn = order === "desc" ? desc : asc;
  const orderBy = additionalOrder
    ? [orderFn(cursorColumn), ...additionalOrder.map((o) => (o.dir === "desc" ? desc : asc)(o.column))]
    : [orderFn(cursorColumn)];

  return { where, orderBy, limit: limit + 1 };
}

export function formatCursorResult<T extends { [key: string]: unknown }>(
  items: T[],
  cursorColumn: keyof T,
  params: CursorPaginationParams,
  totalCount?: number,
): CursorPaginationResult<T> {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  const dir = params.direction ?? "after";
  const isReversed = params.cursor && dir === "before";

  if (isReversed) items.reverse();

  const firstItem = items[0];
  const lastItem = items[items.length - 1];

  return {
    items,
    nextCursor: lastItem ? encodeCursor(lastItem[cursorColumn]) : null,
    prevCursor: firstItem ? encodeCursor(firstItem[cursorColumn]) : null,
    hasNextPage: dir === "after" ? hasMore : !!params.cursor,
    hasPrevPage: dir === "before" ? hasMore : !!params.cursor,
    totalCount,
  };
}

export { encodeCursor, decodeCursor };
