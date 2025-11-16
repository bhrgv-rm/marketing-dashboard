import {
	pgTable,
	serial,
	integer,
	text,
	jsonb,
	timestamp,
	boolean,
	pgEnum,
	index, // ✅ Added: for performance indexing
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { json, number } from "better-auth";
import { role } from "better-auth/plugins";
import { create } from "domain";

// =======================
// ENUMS
// =======================

export const pageCategoryEnum = pgEnum("page_category", [
	"REELS",
	"SHORTS",
	"POSTS",
	"ADS",
	"BLOGS",
	"VIDEOS",
]);

export const taskstatusEnum = pgEnum("page_status", [
	"IDEATION",
	"DEVELOPMENT",
	"INTERNAL REVIEW",
	"INTERNAL REVISION",
	"CLIENT REVIEW",
	"REVISION REQUESTED",
	"APPROVED BY CLIENT",
	"READY TO PUBLISH",
	"HOLD",
	"PUBLISHED",
	"SHELVED",
]);

export const clientStatusEnum = pgEnum("client_status", ["APPROVED", "CHANGES", "DECLINED"]);

export const priorityEnum = pgEnum("priority", ["LOW", "MEDIUM", "HIGH"]);

// =======================
// TABLES
// ============

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	role: text("role"),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	roles: jsonb("roles").$type<number[]>(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const roles = pgTable("roles", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().unique(),
	description: text("description"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Workspace Table ---
export const workspaces = pgTable("workspace", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	image: text("image"),
	information: jsonb("information").$type<Record<string, any>>(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	createdBy: text("created_by").references(() => user.id, { onDelete: "cascade" }),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "cascade" }),
});

export const workspaceClients = pgTable("workspace_clients", {
	id: serial("id").primaryKey(),
	workspaceId: integer("workspace_id")
		.notNull()
		.references(() => workspaces.id, { onDelete: "cascade" }),
	clientId: text("client_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	role: integer("role").notNull().default(6),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	createdBy: text("created_by").references(() => user.id, { onDelete: "cascade" }),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "cascade" }),
});

export const workspaceUsers = pgTable("workspace_users", {
	id: serial("id").primaryKey(),
	workspaceId: integer("workspace_id")
		.notNull()
		.references(() => workspaces.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	role: integer("role").notNull().default(6),
});

export const tasks = pgTable("tasks", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),

	workspaceId: integer("workspace_id")
		.notNull()
		.references(() => workspaces.id),

	priority: priorityEnum("priority").default("MEDIUM"),
	category: pageCategoryEnum("category").notNull(),

	files: jsonb("files").$type<Record<string, any>[]>(),
	publishDate: timestamp("publish_date"),
	deadlineDate: timestamp("deadline_date"),
	captions: jsonb("captions").$type<Record<string, any>[]>(),
	socialLinks: jsonb("social_links").$type<Record<string, any>[]>(),

	clientComment:
		jsonb("client_comment").$type<{ userId: string; comment: string; date: string }[]>(),

	taskstatus: taskstatusEnum("page_status").default("IDEATION"),
	clientStatus: clientStatusEnum("client_status").default("CHANGES"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	createdBy: text("created_by").references(() => user.id, { onDelete: "cascade" }),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "cascade" }),
});

export const tasksAssignees = pgTable("tasks_assignees", {
	id: serial("id").primaryKey(),
	taskId: integer("task_id")
		.notNull()
		.references(() => tasks.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	createdBy: text("created_by").references(() => user.id, { onDelete: "cascade" }),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "cascade" }),
});

export const notifications = pgTable("notifications", {
	id: serial("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	pageId: integer("page_id").references(() => tasks.id),
	readStatus: boolean("read_status").default(false).notNull(),
	content: text("content").notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	createdBy: text("created_by").references(() => user.id, { onDelete: "cascade" }),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "cascade" }),
});

export const mediaContent = pgTable("media_content", {
	id: serial("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	type: text("type").notNull(),
	url: text("url").notNull(),
	originalName: text("original_name").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});
