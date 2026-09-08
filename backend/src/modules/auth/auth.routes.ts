/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.routes.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/08 20:41:49 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/08 22:12:56 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: Fastify route handlers for signup/login/logout

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";
import { validateSignupInput, type SignupInput } from "./auth.validation.js";
import { hashPassword, verifyPassword } from "./password.service.js";
import { generateJwt } from "./jwt.service.js";

// registerAuthRoutes mounts /api/auth/signup, /api/auth/login, /api/auth/logout on the given
// Fastify instance, called from app.ts. Canonical API base path is /api — matches
// frontend/src/auth/{loginForm,signupForm}.ts, which already call these under /api/auth/*
export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
	app.post("/signup", signupHandler);
	app.post("/login", loginHandler);
	app.post("/logout", logoutHandler);
}

interface LoginInput {
	email: string;
	password: string;
}

// signupHandler creates a new user with a hashed/salted password
async function signupHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const input = request.body as Partial<SignupInput> | undefined;
	const email = input?.email?.trim().toLowerCase() ?? "";
	const password = input?.password ?? "";
	const name = input?.name?.trim() ?? "";

	const errors = validateSignupInput({ email, password, name });
	if (errors.length > 0) {
		reply.code(400).send({ error: "invalid_input", details: errors });
		return ;
	}

	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		reply.code(409).send({ error: "email_already_registered" });
		return ;
	}

	const { hash, salt } = await hashPassword(password);

	try {
		const user = await prisma.user.create({
			data: { email, name, passwordHash: hash, passwordSalt: salt },
		});
		const token = generateJwt(user.id);
		reply.code(201).send({
			token,
			user: {
				id: user.id,
				email:user.email,
				name: user.name
			}
		});
		} catch (err) {
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
				reply.code(409).send({ error: "email_already_registered" });
				return ;
		}
		throw err;
	}
}

// loginHandler authenticates an email/password pair and returns a session token
async function loginHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const input = request.body as Partial<LoginInput> | undefined;
	const email = input?.email?.trim().toLowerCase() ?? "";
	const password = input?.password ?? "";

	if (!email || !password) {
		reply.code(400).send({ error: "invalid_input", details: ["email and password are required"]});
		return ;
	}

	const invalidCredentials = () => reply.code(401).send({ error: "invalid_credentials"});

	const user = await prisma.user.findUnique({ where: { email }});
	if (!user) {
		invalidCredentials();
		return ;
	}

	const valid =  await verifyPassword(password, user.passwordHash, user.passwordSalt);
	if (!valid) {
		invalidCredentials();
		return ;
	}

	const token = generateJwt(user.id);
	reply.code(200).send({
		token,
		user: {
			id: user.id,
			email: user.email,
			name: user.name
		}});
}

// logoutHandler invalidates the caller's current session
async function logoutHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	//  If a blocklist is added later for early revocation, insert the token's jti here
	reply.code(204).send();
}
