import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "S506", "N312"
  type: text("type").notNull(), // e.g., "Computer Lab", "Lecture Hall"
  wing: text("wing").notNull(), // "South", "North", "East", "West"
  floor: integer("floor").notNull(), // 1-6
  room: text("room").notNull(), // "01"-"20"
  status: text("status").notNull(), // "available", "occupied"
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  updatedBy: text("updated_by"), // username of reporter
});

export const contributors = pgTable("contributors", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  updateCount: integer("update_count").default(0).notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  lastUpdated: true,
});

export const insertContributorSchema = createInsertSchema(contributors).omit({
  id: true,
  lastActive: true,
});

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Contributor = typeof contributors.$inferSelect;
export type InsertContributor = z.infer<typeof insertContributorSchema>;

// Additional types for the application
export type Wing = "South" | "North" | "East" | "West";
export type Status = "available" | "occupied";
export type RoomType = "Computer Lab" | "Lecture Hall" | "Study Area" | "Library" | "Conference Room" | "Research Lab" | "Classroom" | "Faculty Office";
