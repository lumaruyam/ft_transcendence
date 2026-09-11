/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   projects.service.ts                                :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/10 20:16:15 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/10 21:47:03 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: create/edit/delete for projects (organizations) — the Organization system major module.
// Invite-link membership (project_invites, join-by-token) lives in ./invites.ts, not here —
// this file only owns the project entity itself; project_members stays the sole authorization
// source of truth regardless of how a member was added (owner creation vs. invite join).
import type { Project } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";
import { ROLES } from "../permissions/roles.service.js";

export interface CreateProjectInput {
	name: string;
}

export interface UpdateProjectInput {
	name?: string;
}

const MAX_NAME_LENGTH = 100;

function validateProjectName(name: string | undefined): string[] {
	const errors: string[] = [];
	const trimmed = name?.trim() ?? "";

	if (!trimmed) {
		errors.push("name is required");
	} else if (trimmed.length > MAX_NAME_LENGTH) {
		errors.push(`name must be at most ${MAX_NAME_LENGTH} characters`);
	}
	return errors;
}

export class InvalidProjectInputError extends Error {
	constructor(public readonly details: string[]) {
		super("invalid project input");
		this.name = "InvalidProjectInputError";
	}
}

// createProject creates a new project (workspace) and makes the creator its owner/admin member
export async function createProject(ownerId: string, input: CreateProjectInput): Promise<Project> {
	const errors = validateProjectName(input.name);
	if (errors.length > 0) {
		throw new InvalidProjectInputError(errors);
	}
	const name = input.name.trim();

	return prisma.$transaction(async (tx) => {
		const project = await tx.project.create({
			data: { name, ownerId },
		});
		await tx.projectMember.create({
			data: { projectId: project.id, userId: ownerId, role: ROLES.ADMIN },
		});
		return project;
	});
}

// getProject fetches a project by ID, checking the caller is a member (enforced by permissions middleware upstream).
export async function getProject(id: string): Promise<Project | null> {
	return prisma.project.findUnique({ where: { id }});
}

// updateProject edits a project's editable fields (name, etc.).
export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  // TODO: validate and apply changes via prisma.project.update; only admins should reach this (enforced via requireRole)
  throw new Error("not implemented");
}

// deleteProject removes a project and cascades to its boards/lists/cards/notes/attachments.
export async function deleteProject(id: string): Promise<void> {
  // TODO: decide and implement cascade delete or soft-delete strategy — Prisma's onDelete: Cascade in schema.prisma handles the FK cascade for boards/notes/attachments/api keys/project_invites
}

// listProjectsForUser returns every project a given user is a member of, for the project switcher UI.
export async function listProjectsForUser(userId: string): Promise<Project[]> {
  // TODO: prisma.project.findMany({ where: { members: { some: { userId } } } })
  return [];
}
