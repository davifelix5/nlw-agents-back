import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod/v4";
import { db } from "../../db/connection.ts";
import { schema } from "../../db/schema/index.ts";

export const createQuestionRoute: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/:roomId/questions",
		{
			schema: {
				body: z.object({
					question: z.string().min(1, "Question is required"),
				}),
				params: z.object({
					roomId: z.string(),
				}),
			},
		},
		async (req, res) => {
			const { question } = req.body;
			const { roomId } = req.params;

			const result = await db
				.insert(schema.questions)
				.values({
					roomId,
					question,
				})
				.returning();

			if (!result[0]) {
				throw new Error("Failed to create question");
			}

			return res.status(201).send({ questionId: result[0].id });
		},
	);
};
