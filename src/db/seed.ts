import { reset, seed } from "drizzle-seed";
import { db, sql } from "./connection.ts";
import { schema } from "./schema/index.ts";

await reset(db, schema);

await seed(db, schema).refine((f) => {
	return {
		rooms: {
			count: 5,
			columns: {
				name: f.companyName(),
				description: f.loremIpsum({ sentencesCount: 10 }),
			},
			with: {
				questions: 5,
			},
		},
		questions: {
			columns: {
				question: f.loremIpsum({ sentencesCount: 5 }),
				answer: f.loremIpsum({ sentencesCount: 10 }),
			},
		},
	};
});

await sql.end();
