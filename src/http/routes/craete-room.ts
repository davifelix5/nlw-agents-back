import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod/v4";
import { db } from "../../db/connection.ts";
import { schema } from "../../db/schema/index.ts";

export const createRoomRoute: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/rooms",
		{
			schema: {
				body: z.object({
					name: z.string().min(1, "Name is required"),
					description: z.string().optional(),
				}),
			},
		},
		async (req, res) => {
			const { name, description } = req.body;

			const result = await db
				.insert(schema.rooms)
				.values({
					name,
					description,
				})
				.returning();

			if (!result[0]) {
				throw new Error("Failed to create room");
			}

			return res.status(201).send({ roomId: result[0].id });
		},
	);
};
