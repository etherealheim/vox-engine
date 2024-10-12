import { drizzle } from 'drizzle-orm/connect';

async function main() {
    const db = await drizzle("vercel-postgres");
}
main();