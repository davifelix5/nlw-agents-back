import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod/v4";
import { db } from "../../db/connection.ts";
import { schema } from "../../db/schema/index.ts";
import { generateAnswer, generateEmbeddings } from "../../services/gemini.ts";

export const createQuestionRoute: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/rooms/:roomId/questions",
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

			const embeddings = await generateEmbeddings(question);

			const embeddingsVectorString = `[${embeddings.join(",")}]`;

			const chunks = await db
				.select({
					id: schema.audioChunks.id,
					transcription: schema.audioChunks.transcription,
					similarity: sql<number>`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsVectorString}::vector)`,
				})
				.from(schema.audioChunks)
				.where(
					and(
						eq(schema.audioChunks.roomId, roomId),
						sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsVectorString}::vector) > 0.7`,
					),
				)
				.orderBy(
					sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsVectorString}::vector)`,
				)
				.limit(3);

			let answer: string | null = null;

			if (chunks.length > 0) {
				const transcriptions = chunks.map((c) => c.transcription);
				answer = await generateAnswer(question, transcriptions);
			}

			const result = await db
				.insert(schema.questions)
				.values({
					roomId,
					question,
					answer,
				})
				.returning();

			if (!result[0]) {
				throw new Error("Failed to create question");
			}

			return res.status(201).send({ questionId: result[0].id, answer });
		},
	);
};
