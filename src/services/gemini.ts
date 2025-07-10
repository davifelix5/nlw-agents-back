import { GoogleGenAI } from "@google/genai";
import { env } from "../env.ts";

const gemini = new GoogleGenAI({
	apiKey: env.GEMINI_API_KEY,
});

const transcriptionModel = "gemini-2.5-flash";
const embeddingModel = "text-embedding-004";

export const transcribeAudio = async (
	base64Audio: string,
	mimeType: string,
) => {
	const response = await gemini.models.generateContent({
		model: transcriptionModel,
		contents: [
			{
				text: "Transcreva o áudio para português do Brasil. Seja preciso e natura na transcrição. Mantenha a pontuação adequada e divida o texto em parágrafos quando for apropriado.",
			},
			{
				inlineData: {
					mimeType,
					data: base64Audio,
				},
			},
		],
	});

	if (!response.text) {
		throw new Error("Failed to transcribe audio");
	}

	return response.text;
};

export const generateEmbeddings = async (text: string) => {
	const response = await gemini.models.embedContent({
		model: embeddingModel,
		contents: [{ text }],
		config: { taskType: "RETRIEVAL_DOCUMENT" },
	});

	if (!response.embeddings?.[0].values) {
		throw new Error("Failed to generate embeddings");
	}

	return response.embeddings[0].values;
};

export const generateAnswer = async (
	question: string,
	transcriptions: string[],
) => {
	const context = transcriptions.join("\n\n");

	const prompt = `
		Com base no texto fornecido abaixo como contexto, responda a pergunta de forma clara e precisa em português do Brasil.

		CONTEXTO:
		${context}

		QUESTION:
		${question}

		INTRUÇÕES:
		- Use apenas informações fornecidas no contexto enviado;
		- Se a resposta não for encontrada no contexto, apenas responda que não possui informações suficientes para responder;
		- Seja objetivo;
		- Mantenha um tom educativo e profissional;
		- Cite trechos relevates do contexto se apropriado;
		- Caso cite o contexto, refira-se a esse contexto usando o termo "conteúdo da aula".
	`;

	const response = await gemini.models.generateContent({
		model: transcriptionModel,
		contents: [{ text: prompt }],
	});

	if (!response.text) {
		throw new Error("Failed to generate response");
	}

	return response.text;
};
