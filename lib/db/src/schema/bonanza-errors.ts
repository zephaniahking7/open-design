import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Centralised error log for both client-side reports (POST /api/error
// from the public landing) and server-side handler failures (caught
// by the global Express error middleware). Stack traces are stored
// truncated; this table is internal-only and never exposed to public
// clients.
export const bonanzaErrorsTable = pgTable(
  "bonanza_errors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: text("source").notNull(),
    message: text("message").notNull(),
    stack: text("stack"),
    context: jsonb("context"),
    userAgent: text("user_agent"),
    url: text("url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bonanza_errors_created_at_idx").on(table.createdAt.desc()),
    index("bonanza_errors_source_idx").on(table.source),
  ],
);

export const insertBonanzaErrorSchema = createInsertSchema(bonanzaErrorsTable)
  .omit({ id: true, createdAt: true });
export type InsertBonanzaError = z.infer<typeof insertBonanzaErrorSchema>;
export type BonanzaError = typeof bonanzaErrorsTable.$inferSelect;
