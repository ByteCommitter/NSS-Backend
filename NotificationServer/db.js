import {DatabaseSync} from 'node:sqlite'

//we're using an InMemory database, NOT FOR PRODUCTION
const db= new DatabaseSync(':memory:')


//create Table notifications:
db.exec(`
        CREATE TABLE notifications(
        id TEXT,
        title TEXT,
        message TEXT,
        isRead BOOLEAN DEFAULT 0,
        PRIMARY KEY (id)
        )
    `);

//Notifications are implemented via web sockets right?

export default db;


/*To register for a user:

INSERT INTO user_event 
VALUES (1, 2, 0);


To Mark for verification:
UPDATE user_event
SET isParticipated=1
where user_id=? and event_id=?

*/

