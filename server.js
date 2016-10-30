var express = require('express');
var app = express();
var server = app.listen(3000);

app.use(express.static('public'));
console.log("My socket server is running");

var socket = require('socket.io');
var io = socket(server);

io.sockets.on('connection', function (socket) {
    console.log("new connection: " + socket.id);

    socket.on('mouse', function (data) {
        socket.broadcast.emit('mouse', data);
    });

    socket.on('disengage', function () {
        socket.broadcast.emit('disengage');
    });

    socket.on('chat message', function (data) {
        socket.broadcast.emit('chat message', data);
    });

    socket.on('color', function (color) {
        socket.broadcast.emit('color', color);
    });
    
    socket.on('eraser', function () {
        socket.broadcast.emit('eraser');
    });

    socket.on('size', function (size) {
        socket.broadcast.emit('size', size);
    });

    socket.on('clear', function () {
        socket.broadcast.emit('clear');
    });
});

