import {DatabaseSync} from 'node:sqlite'

//we're using an InMemory database, NOT FOR PRODUCTION
const db= new DatabaseSync(':memory:')


//Execute SQL statements from strings

//one table for users
db.exec(`
    CREATE TABLE users(
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        USERNAME TEXT UNIQUE,
        PASSWORD TEXT
    )
    `)

//one table for each user having their todo lists
db.exec(`
    CREATE TABLE todos  (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        USER_ID INTEGER,
        TASK TEXT,
        COMPLETED BOOLEAN DEFAULT 0,
        FOREIGN KEY (USER_ID) REFERENCES users(id)
    )
    `)

export default db;
