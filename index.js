// EXPRESS MODULE
const express = require('express');
const session = require('express-session');
const http = require('http');

// BODY PARSER
const bodyParser = require('body-parser');

// MYSQL
const mysql = require('mysql2');

// CORS MODULE
const cors = require('cors');

// CREATE EXPRESS APP & WEBSOCKET
const app = express();
const server = http.createServer(app);

// SERVER PORT
const PORT = 5510;

// CORS OPTIONS
const corsOptions = {
    origin: 'http://tomchoi1544.cafe24.com:5500',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials:true,
};

// MIDDLEWARE
app.use(cors(corsOptions));

app.use(
    session({
        secret: "SECRET",
        resave: false,
        saveUninitialized: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

const dbConfig = {
    host: 'localhost',
    user: 'new_user',
    password: 'password',
    database: 'chatapp',
};

const conn = mysql.createConnection(dbConfig);
conn.connect(error => {
    if (error) {
        console.error('Connection failed: ', error);
    } else {
        console.log('Connected to the database');
    }
});

// HANDLE GET
app.get('/api/messages', (req, res) => {
    const r = req.query.room;
    // console.log(`FETCHING MESSAGES FOR ROOM ${req.query.room}...`)
    const query = `SELECT * FROM chatappmessages WHERE room = ${r}`;
    conn.query(query, (queryError, results) => {
        if (queryError) {
            throw queryError;
        } else if (Object.keys(results).length > 0) {
            res.json({output: results});
            res.end();
        } else {
            res.json({output: []});
            res.end();
        }
    });
});

app.get('/api/roomdata/:room', (req, res) => {
    const { room } = req.params;

    const roomcheck = `SELECT * FROM chatapp_rooms WHERE number = ${room}`;
    conn.query(roomcheck, (queryError, results) => {
        if (queryError) {
            throw queryError;
        } else {
            // console.log(`ROOMDATA for ${req.session.username}: ${results[0].open}`)
            if (results[0].open) {
                const query = `SELECT * FROM chatappusers WHERE curr_room = ${room}`;
                conn.query(query, (queryError, results) => {
                    if (queryError) {
                        throw queryError;
                    } else {
                        var usersList = results;
                        res.json({
                                    usersList: usersList,
                                })
                    }
                });            
            } else {
                console.log(`Room ${room} Closed, Moving ${req.session.username}`)
                res.json({
                  message: 'ROOM CLOSED'
                });
                res.end();
            }
        }
    });
});

app.get('/api/session', (req, res) => {
    if (req.session.loggedin) {
        res.json({
            user: req.session.username,
            firstname: req.session.firstname
        })
        res.end();
    } else {
        res.json({
            user: null,
            firstname: null,
        })
        res.end();
    }
});

app.get('/api/rooms', (req, res) => {
    const query = 'SELECT * FROM chatapp_rooms WHERE open = true';
    conn.query(query, (error, results) => {
        if (error) {
            throw error;
        } else {
            res.json(results);
            res.end();
        }
    })
})

// HANDLE POST
app.post('/api/login', (req, res) => {
    const u = req.body.username;
    const p = req.body.password;
    const query = `SELECT firstName FROM chatappusers WHERE userName = '${u}' AND pw = '${p}'`;
    conn.query(query, (queryError, results) => {
        if (queryError) {
            console.error('ERROR: ', queryError);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (results.length === 0) {
            res.status(401).json({error: 'NO USER FOUND'})
        } else {
            req.session.loggedin = true;
            req.session.firstname = results[0].firstName;
            req.session.username = u;
            console.log(`SESSION STARTED: ${req.session.firstname} (${req.session.username})`)
            res.json({ message: `Success: FIRSTNAME = ${req.session.firstname}, USERNAME = ${req.session.username}`});
        } 
        return res.end();
    })
});

app.post('/api/addroom', (req, res) => {
    const r = conn.escape(decodeURIComponent(req.body.roomname));
    const o = req.body.owner;
    console.log(`NEW ROOM! roomname: ${r}, owner: ${o}`)
    const query = `INSERT INTO chatapp_rooms (roomname, owner) VALUES (${r}, '${o}')`;

    conn.query(query, (error, results) => {
        if (error) {
            console.error(`ERROR: ${error}`);
            res.status(500).json({error: 'Internal Server Error in Step 1'});
        } else {
            const query = `SELECT number FROM chatapp_rooms WHERE roomname = ${r} AND owner = '${o}'`;
            conn.query(query, (error, results) => {
                if (error) {
                    console.error(`ERROR: ${error}`);
                    res.status(500).json({error: 'Internal Server Error in Step 2'});
                } else {
                    console.log('RESULTS', results);
                    res.json({number: results[0].number});
                }
            })
        }
    })
});

app.post('/api/delroom/:room', (req, res) => {
    const {room} = req.params;
    console.log(`deleting room ${room}`)
    const query = 'UPDATE chatapp_rooms SET open = false WHERE number = ?'
    conn.query(query, [room], (error, results) => {
        if (error) {
            console.error(`ERROR CLOSING ROOM: ${error}`);
        } else {
            res.json({message: 'SUCCESS'})
            console.log('ROOM SUCCESSFULLY CLOSED, MOVING USERS');
        }
    })
});


app.post('/api/signup', (req, res) => {
    const { username, firstname, lastname, password } = req.body;
    console.log(`NEW USER! ${username}, ${firstname}, ${lastname}`)
    const query = `INSERT INTO chatappusers (userName, firstName, lastName, pw) VALUES ('${username}', '${firstname}', '${lastname}', '${password}')`;

    conn.query(query, (error, results) => {
        if (error) {
            console.error('ERROR: ', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log('SUCCESS')
            res.json({ message: 'SUCCESS' });
        }
    })
});

app.post('/api/sendmessage', (req, res) => {
    const u = req.body.userName;
    const t = req.body.time;
    const r = req.body.room;

    const safemessage = conn.escape(decodeURIComponent(req.body.message));

    const query = `INSERT INTO chatappmessages (userName, message, time, room) VALUES ('${u}', ${safemessage}, '${t}', '${r}')`

    conn.query(query, (error, results) => {
        if (error) {
            console.error(`ERROR: ${error}`);
            res.status(500).json({error: 'Internal Server Error'});
        } else {
            res.json({message: 'Sent Successfully'});
        }
    })
})

app.put('/api/enterroom/:username/:room', (req, res) => {
    const {username, room} = req.params;
    const query = 'UPDATE chatappusers SET curr_room = ? WHERE userName = ?';

    conn.query(query, [room, username], (error, result) => {
        if (error) {
            console.error('Error: ' + err);
            res.status(500).send('Error Entering Room');
        } else {
            // console.log(`USER ${username} Entering Room ${room}`);
            const query = `SELECT roomname, owner FROM chatapp_rooms WHERE number = ${room}`;
            conn.query(query, (qerr, rsults) => {
                if (qerr) {
                    throw qerr;
                } else {
                    res.json({
                        roomname: rsults[0].roomname,
                        owner: rsults[0].owner,
                    })
                }
            }) 
        }
    })
})

app.get('/api/logout/:username', (req, res) => {
    const {username} = req.params;
    console.log(`${username} LOGGING OUT`);

    const query = `UPDATE chatappusers SET curr_room = NULL WHERE userName = '${username}'`;
    conn.query(query, (qerr, rsults) => {
        if (qerr) {
            throw qerr;
        } else {
            req.session.destroy((err) => {
                if (err) {
                  console.error('Error logging out:', err);
                } else {
                    console.log('SESSION ENDED');
                  res.json({
                      message: 'REDIRECT TO LOGIN'
                  })
                }
            });
        }
    }) 
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});