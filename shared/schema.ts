import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "S506", "N312"
  type: text("type").notNull(), // e.g., "Computer Lab", "Lecture Hall"
  category: text("category").notNull(), // "room", "hall", "lagoon_stall"
  wing: text("wing"), // "South", "North", "East", "West" (null for halls/lagoon)
  floor: integer("floor"), // 1-6 (null for halls/lagoon)
  room: text("room"), // "01"-"20" (null for halls/lagoon)
  status: text("status").notNull(), // "available", "occupied", "open", "closed"
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  updatedBy: text("updated_by"), // username of reporter
});

export const contributors = pgTable("contributors", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  userCode: text("user_code").notNull(), // 20**-**** | PUP**-**** | EMP**-****
  userType: text("user_type").notNull(), // "student", "admin", "employee"
  updateCount: integer("update_count").default(0).notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userCode: text("user_code").notNull(),
  userType: text("user_type").notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  lastUpdated: true,
});

export const insertContributorSchema = createInsertSchema(contributors).omit({
  id: true,
  lastActive: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Contributor = typeof contributors.$inferSelect;
export type InsertContributor = z.infer<typeof insertContributorSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Additional types for the application
export type Wing = "South" | "North" | "East" | "West";
export type Status = "available" | "occupied" | "open" | "closed";
export type RoomType = "Computer Lab" | "Lecture Hall" | "Study Area" | "Library" | "Conference Room" | "Research Lab" | "Classroom" | "Faculty Office";
export type Category = "room" | "hall" | "lagoon_stall";
export type UserType = "student" | "admin" | "employee";
