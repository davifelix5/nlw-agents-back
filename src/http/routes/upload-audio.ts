import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod/v4";
import { db } from "../../db/connection.ts";
import { schema } from "../../db/schema/index.ts";
import { generateEmbeddings, transcribeAudio } from "../../services/gemini.ts";

export const uploadAudioRoute: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/rooms/:roomId/audio",
		{
			schema: {
				params: z.object({
					roomId: z.string(),
				}),
			},
		},
		async (req, res) => {
			const { roomId } = req.params;
			const audio = await req.file();

			if (!audio) {
				throw new Error("No audio file uploaded");
			}

			const audioBuffer = await audio.toBuffer();
			const base64Audio = audioBuffer.toString("base64");

			const transcription = await transcribeAudio(base64Audio, audio.mimetype);
			const embeddings = await generateEmbeddings(transcription);

			const result = await db
				.insert(schema.audioChunks)
				.values({
					roomId,
					transcription,
					embeddings,
				})
				.returning();

			if (!result[0]) {
				throw new Error("Failed to save audio chunk");
			}

			return res.status(201).send({ chunkId: result[0].id });
		},
	);
};
