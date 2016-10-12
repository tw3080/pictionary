var http = require('http');
var express = require('express');
var socket_io = require('socket.io');

var app = express();
app.use(express.static('public'));

var server = http.Server(app);
var io = socket_io(server);

var userList = {}; // List of connected sockets
var drawer; // Designated drawer for each turn

// List of possible words which users can draw
var WORDS = [
    "word", "letter", "number", "person", "pen", "class", "people",
    "sound", "water", "side", "place", "man", "men", "woman", "women", "boy",
    "girl", "year", "day", "week", "month", "name", "sentence", "line", "air",
    "land", "home", "hand", "house", "picture", "animal", "mother", "father",
    "brother", "sister", "world", "head", "page", "country", "question",
    "answer", "school", "plant", "food", "sun", "state", "eye", "city", "tree",
    "farm", "story", "sea", "night", "day", "life", "north", "south", "east",
    "west", "child", "children", "example", "paper", "music", "river", "car",
    "foot", "feet", "book", "science", "room", "friend", "idea", "fish",
    "mountain", "horse", "watch", "color", "face", "wood", "list", "bird",
    "body", "dog", "family", "song", "door", "product", "wind", "ship", "area",
    "rock", "order", "fire", "problem", "piece", "top", "bottom", "king",
    "space"
];
var randomWord;
// Returns a random word from the WORDS array
var getRandomWord = function() {
    randomNum = Math.floor(Math.random() * WORDS.length - 1);
    randomWord = WORDS[randomNum];
    return randomWord;
};

getRandomWord();

io.on('connection', function(socket) {
    userList[socket.id] = socket.id;
    // The first user to connect will become the designated drawer; all users who connect after will become guessers
    if (Object.keys(userList).length == 1) {
        drawer = socket.id;
    } else {
        socket.emit('guesser', true);
    }

    socket.on('draw', function(position) {
        io.sockets.emit('draw', position);
    });

    // Check if the guessed word matches the correct word
    socket.on('guess', function(word) {
        // If the words match, the correct guesser becomes the drawer
        if (word == randomWord) {
            drawer = socket.id;
            console.log(drawer);
            socket.broadcast.emit('guesser', true);
            socket.emit('drawer', true, getRandomWord());
        }
        // Emit the guessed word so all users can see it
        io.sockets.emit('guess', word);
    });

    // Send the current drawer a random word
    socket.on('drawer', function(data) {
        if (drawer == socket.id) {
            socket.emit('drawer', true, randomWord);
        }
    });

    socket.on('disconnect', function() {
        // Remove the disconnected user from the global userList
        delete userList[socket.id];
        // If the drawer disconnects before the round is finished, pick a random user as the next drawer
        if ((Object.keys(userList).length === 0) || drawer != socket.id) {
            return;
        }
        var randomNum = Math.floor(Math.random() * (Object.keys(userList).length - 1));
        drawer = Object.keys(userList)[randomNum];
        socket.broadcast.emit('guesser', true);
        socket.broadcast.to(drawer).emit('drawer', true, getRandomWord());
    });
});

server.listen(process.env.PORT || 8080);
