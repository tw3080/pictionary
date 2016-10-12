var pictionary = function() {
    var socket = io();
    var canvas, context;
    var drawing = false;
    var guessBox = $('#guess input');
    var guessContainer = $('#guess-container');
    var clientId;
    var drawer = false;
    var randomWord;
    var userWord = $('#word');

    canvas = $('canvas');
    context = canvas[0].getContext('2d');
    canvas[0].width = canvas[0].offsetWidth;
    canvas[0].height = canvas[0].offsetHeight;

    // Begin drawing
    var draw = function(position) {
        context.beginPath();
        context.arc(position.x, position.y, 6, 0, 2 * Math.PI);
        context.fill();
    };

    var onKeyDown = function(event) {
        if (event.keyCode != 13) { // Enter
            return;
        }

        // When a user enters a guess, bind that guess to the variable 'word'
        var word = guessBox.val();
        guessBox.val('');
        socket.emit('guess', word);
    };

    // If the user is the designated drawer, enable them to draw on mousedown within the canvas
    canvas.on('mousedown', function() {
        if (drawer) {
            drawing = true;
        }
    });

    // Disable drawing on mouseup
    canvas.on('mouseup', function() {
        drawing = false;
    });

    canvas.on('mousemove', function(event) {
        if (drawing === false) {
            return;
        }

        // Gets the position of the mouse on the canvas
        var offset = canvas.offset();
        var position = {
            x: event.pageX - offset.left,
            y: event.pageY - offset.top
        };

        socket.emit('draw', position);
    });

    socket.on('draw', function(position) {
        draw(position);
    });

    socket.emit('drawer', drawer);

    // When a drawer is assigned, show that user their random word, hide the guess input box, and clear the canvas for the drawer
    socket.on('drawer', function(data, word) {
        drawer = data;
        randomWord = word;
        userWord.show();
        userWord.text('Your word: ' + word);
        $('#guess').hide();
        context.beginPath();
        context.clearRect(0, 0, canvas[0].width, canvas[0].height);
    });

    // Display the most recently guessed word
    socket.on('guess', function(word) {
        guessContainer.text(word);
    });

    guessBox.on('keydown', onKeyDown);

    // When a new guesser is assigned, hide the random word, show the guess input box, and clear the canvas for each guesser
    socket.on('guesser', function(data) {
        drawer = false;
        userWord.hide();
        $('#guess').show();
        context.beginPath();
        context.clearRect(0, 0, canvas[0].width, canvas[0].height);
    });
};

$(document).ready(function() {
    pictionary();
});
