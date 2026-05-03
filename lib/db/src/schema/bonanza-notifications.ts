import { pgTable, uuid, text, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Audit trail for operator notifications fired when a lead or brief
// lands. Stage 1 ships the NoOp adapter — every row therefore starts
// life as `status='deferred'` and the real adapter (Resend) flips
// rows to `sent` / `failed` once the connector + recipient secret
// are in place. Failures NEVER block the submitter; they live here
// instead.
export const bonanzaNotificationsTable = pgTable(
  "bonanza_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    sourceId: uuid("source_id").notNull(),
    recipient: text("recipient").notNull().default(""),
    status: text("status").notNull(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bonanza_notifications_created_at_idx").on(table.createdAt.desc()),
    index("bonanza_notifications_type_status_idx").on(table.type, table.status),
    check(
      "bonanza_notifications_type_check",
      sql`${table.type} IN ('brief','lead')`,
    ),
    check(
      "bonanza_notifications_status_check",
      sql`${table.status} IN ('sent','failed','deferred')`,
    ),
  ],
);

export const insertBonanzaNotificationSchema = createInsertSchema(
  bonanzaNotificationsTable,
).omit({ id: true, createdAt: true });
export type InsertBonanzaNotification = z.infer<
  typeof insertBonanzaNotificationSchema
>;
export type BonanzaNotification = typeof bonanzaNotificationsTable.$inferSelect;
