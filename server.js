require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path');

const port = 5000;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


app.set('views', __dirname);

app.set('view engine', 'ejs');
// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Parse incoming requests with JSON payloads
app.use(bodyParser.json());

// Parse incoming requests with urlencoded payloads
app.use(bodyParser.urlencoded({ extended: true }));

let users = [];
let usersMap = {};
let messages = {}; // Store messages with sender and receiver usernames

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});








const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const dbName = 'ChitChat';
let db; // Declare db variable here

async function run() {
    try {
      // Connect the client to the server (optional starting in v4.7)
      await client.connect();
      db = client.db(dbName); // Assign db here
      // Send a ping to confirm a successful connection
      await client.db(dbName).command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
  
      // Move message handling logic here
      io.on('connection', (socket) => {
        console.log('A user connected');
  
        socket.on('new user', (username) => {
            console.log('User ' + username + ' connected');
            usersMap[socket.id] = username;
            io.emit('users online', Object.values(usersMap));
        });
  
        socket.on('chat message', (data) => {
            console.log('Message received from ' + data.from + ' to ' + data.to + ': ' + data.message);
        
            // Store the message in MongoDB
            db.collection('messages').insertOne({
                from: data.from,
                to: data.to,
                message: data.message,
                timestamp: new Date(),
            }, (err, result) => {
                if (err) {
                    console.error('Failed to insert message into MongoDB:', err);
                    return;
                }
        
                console.log('Message inserted into MongoDB');
            });
        
            io.emit('chat message', { from: data.from, to: data.to, message: data.message });
        });

        socket.on('retrieve messages', async function(data) {
            const allMessages = await db.collection('messages')
                .find({
                    $or: [
                        { from: data.from, to: data.to },
                        { from: data.to, to: data.from }
                    ]
                })
                .sort({ timestamp: 1 })
                .toArray();
        
            // Emit the messages back to the client
            socket.emit('messages retrieved', allMessages);
        });

        socket.on('retrieve messages gc', async function(data) {
            const allMessages = await db.collection('messages')
                .find({ to: data.to })
                .sort({ timestamp: 1 })
                .toArray();
        
            // Emit the messages back to the client
            socket.emit('messages retrieved', allMessages);
        });
        
        
  
        socket.on('disconnect', () => {
            console.log('A user disconnected');
            const username = usersMap[socket.id];
            delete usersMap[socket.id];
            io.emit('users online', Object.values(usersMap));
        });
      });
  
    } finally {
      // Ensures that the client will close when you finish/error
      // await client.close(); // You might not want to close the connection here, depending on your application's needs
    }
  }
  run().catch(console.dir);

// io.on('connection', (socket) => {
//     console.log('A user connected');

//     socket.on('new user', (username) => {
//         console.log('User ' + username + ' connected');
//         usersMap[socket.id] = username;
//         io.emit('users online', Object.values(usersMap));
//     });

//     socket.on('chat message', (data) => {
//         console.log('Message received from ' + data.from + ' to ' + data.to + ': ' + data.message);
    
//         // Store the message in MongoDB
//         db.collection('messages').insertOne({
//             from: data.from,
//             to: data.to,
//             message: data.message,
//             timestamp: new Date(),
//         }, (err, result) => {
//             if (err) {
//                 console.error('Failed to insert message into MongoDB:', err);
//                 return;
//             }
    
//             console.log('Message inserted into MongoDB');
//         });
    
//         io.emit('chat message', { from: data.from, to: data.to, message: data.message });
//     });

//     socket.on('disconnect', () => {
//         console.log('A user disconnected');
//         const username = usersMap[socket.id];
//         delete usersMap[socket.id];
//         io.emit('users online', Object.values(usersMap));
//     });
// });

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
