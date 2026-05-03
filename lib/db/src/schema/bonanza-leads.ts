import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Capture rows for the public landing's "describe your vision" form.
// Each submission becomes a lead that the studio can later promote
// into a full brief.
export const bonanzaLeadsTable = pgTable(
  "bonanza_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vision: text("vision").notNull(),
    aiOutput: text("ai_output"),
    email: text("email").notNull(),
    source: text("source").default("landing"),
    userAgent: text("user_agent"),
    referrer: text("referrer"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("bonanza_leads_created_at_idx").on(table.createdAt.desc()),
  ],
);

export const insertBonanzaLeadSchema = createInsertSchema(bonanzaLeadsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertBonanzaLead = z.infer<typeof insertBonanzaLeadSchema>;
export type BonanzaLead = typeof bonanzaLeadsTable.$inferSelect;
