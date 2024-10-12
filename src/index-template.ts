// import 'dotenv/config';
// import { drizzle } from 'drizzle-orm/connect';
// import { eq } from 'drizzle-orm';
// import { usersTable } from './db/schema';

// async function main() {
//     const db = await drizzle("vercel-postgres");

//     // Creating a user data / Populating a table
//     // This is also the object we are refering to backwards
//     const user: typeof usersTable.$inferInsert = {
//         name: 'John',
//         age: 30,
//         email: 'john@example.com',
//     };

//     await db.insert(usersTable).values(user);
//     console.log('New user created!')

//     // Reading a user data / Simple console log
//     const users = await db.select().from(usersTable);
//     console.log('Getting all users from the database: ', users)

//     // Updates a users age based on Email address
//     await db
//         .update(usersTable)
//         .set({
//             age: 31,
//         })
//         .where(eq(usersTable.email, user.email));
//     console.log('User info updated!')

//     // Deletes a user based on Email
//     await db.delete(usersTable).where(eq(usersTable.email, user.email));
//     console.log('User deleted!')
// }

// main();