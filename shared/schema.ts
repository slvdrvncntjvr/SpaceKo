import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "S506", "N312"
  type: text("type").notNull(), // e.g., "Computer Lab", "Lecture Hall"
  category: text("category").notNull(), // "room", "hall", "lagoon_stall", "service"
  wing: text("wing"), // "South", "North", "East", "West" (null for halls/lagoon/services)
  floor: integer("floor"), // 1-6 (null for halls/lagoon/services)
  room: text("room"), // "01"-"20" (null for halls/lagoon/services)
  status: text("status").notNull(), // "available", "occupied", "open", "closed"
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  updatedBy: text("updated_by"), // username of reporter
  verifiedBy: text("verified_by"), // admin who verified this status
  verifiedAt: timestamp("verified_at"), // when it was verified
  ownedBy: text("owned_by"), // for lagoon stalls and services - the employee who owns it
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userCode: text("user_code").notNull().unique(),
  username: text("username").notNull(),
  userType: text("user_type").notNull(), // "student", "admin", "lagoon_employee", "office_employee", "superadmin"
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by"), // SUPERADMIN who created this account
  
  // Student specific fields
  studentId: text("student_id"),
  grade: text("grade"),
  section: text("section"),
  
  // Admin specific fields
  office: text("office"),
  position: text("position"),
  
  // Employee specific fields
  workplace: text("workplace"), // For lagoon: stall name, for office: office name
  employeeId: text("employee_id"),
});

export const contributors = pgTable("contributors", {
  id: serial("id").primaryKey(),
  userCode: text("user_code").notNull(),
  username: text("username").notNull(),
  userType: text("user_type").notNull(),
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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
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
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Contributor = typeof contributors.$inferSelect;
export type InsertContributor = z.infer<typeof insertContributorSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Additional types for the application
export type Wing = "South" | "North" | "East" | "West";
export type Status = "available" | "occupied" | "open" | "closed";
export type RoomType = "Computer Lab" | "Lecture Hall" | "Study Area" | "Library" | "Conference Room" | "Research Lab" | "Classroom" | "Faculty Office" | "Service Office";
export type Category = "room" | "hall" | "lagoon_stall" | "service";
export type UserType = "student" | "admin" | "lagoon_employee" | "office_employee" | "superadmin";
