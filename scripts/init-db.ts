import { db } from '../src/db/config';
import { politicians } from '../src/db/schema';

const initialPoliticians = [
  {
    name: 'Petr Fiala',
    twitterHandle: 'P_Fiala',
    party: 'ODS',
  },
  {
    name: 'Andrej Babiš',
    twitterHandle: 'AndrejBabis',
    party: 'ANO',
  },
  // Add more politicians as needed
];

const main = async () => {
  try {
    console.log('Initializing database with politicians...');
    
    // Insert politicians
    for (const politician of initialPoliticians) {
      await db.insert(politicians).values(politician).onConflictDoNothing();
    }
    
    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

main(); 