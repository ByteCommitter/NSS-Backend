import {DatabaseSync} from 'node:sqlite'

//we're using an InMemory database, NOT FOR PRODUCTION
const db= new DatabaseSync(':memory:')


//Execute SQL statements from strings

//one table for users
db.exec(`
    CREATE TABLE users(
        university_id TEXT PRIMARY KEY UNIQUE,
        username TEXT,
        password TEXT,
        points INTEGER,
        profile_image TEXT DEFAULT NULL
    )
    `)
//Sign up shall take in name, user and password.
//Implement forgot password method

//one table for each user having their todo lists
db.exec(`
    CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE,
        fromTime Time,
        ToTime Time,
        eventVenue TEXT,
        banner_image TEXT DEFAULT NULL
    )
    `)

//we should be able to join the table and get the registered users in their particular events
db.exec(`CREATE TABLE user_event (
            user_id TEXT,
            event_id INTEGER,
            isParticipated BOOLEAN DEFAULT 0,
            PRIMARY KEY (user_id, event_id),
            FOREIGN KEY (user_id) REFERENCES users(university_id),
            FOREIGN KEY (event_id) REFERENCES events(id)
        )
    `);


export default db;


/*To register for a user:

INSERT INTO user_event 
VALUES (1, 2, 0);


To Mark for verification:
UPDATE user_event
SET isParticipated=1
where user_id=? and event_id=?

*/

