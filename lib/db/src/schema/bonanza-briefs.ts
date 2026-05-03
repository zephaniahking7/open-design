import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bonanzaLeadsTable } from "./bonanza-leads";

// Internal Bonanza Studio brief records. Briefs may be created
// manually, generated from a public form, or promoted from an
// existing lead. Title-generation rules live server-side; this
// table just stores the resulting strings.
export const bonanzaBriefsTable = pgTable(
  "bonanza_briefs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    clientName: text("client_name").notNull().default(""),
    clientEmail: text("client_email").notNull().default(""),
    vision: text("vision").notNull(),
    budgetNote: text("budget_note").notNull().default("Not specified"),
    status: text("status").notNull().default("new"),
    notes: text("notes").notNull().default(""),
    sourceLeadId: uuid("source_lead_id").references(
      () => bonanzaLeadsTable.id,
      { onDelete: "set null" },
    ),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Partial index supports the studio list view, which always
    // filters out soft-deleted rows and orders by recency within a
    // single status tab.
    index("bonanza_briefs_status_updated_idx")
      .on(table.status, table.updatedAt.desc())
      .where(sql`${table.deletedAt} IS NULL`),
    index("bonanza_briefs_deleted_at_idx").on(table.deletedAt),
    check(
      "bonanza_briefs_status_check",
      sql`${table.status} IN ('new','active','completed')`,
    ),
  ],
);

export const insertBonanzaBriefSchema = createInsertSchema(bonanzaBriefsTable)
  .omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertBonanzaBrief = z.infer<typeof insertBonanzaBriefSchema>;
export type BonanzaBrief = typeof bonanzaBriefsTable.$inferSelect;
