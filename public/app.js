var socket;
var isDragging = false;
var canvas;
var m_size = 2;
var m_color = '#000000';
var context;

function init() {
    canvas = document.getElementById("canvas");
    context = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context.lineWidth = m_size * 2;
    context.strokeStyle = m_color;
    context.fillStyle = m_color;
}

$(document).ready(function() {
    init();
    window.addEventListener('resize', init, false);

    $('#canvas').mousedown(engage);

    $('#canvas').mousemove(function(e) {
        if (isDragging) {
            var data = {
                x: e.clientX,
                y: e.clientY
            }
            socket.emit('mouse', data);

            drawPoint(data);
        }
    });

    $('#canvas').mouseup(disengage);

    $('#canvas').mouseleave(disengage);

    $('.item').click(itemClick);

    $('#chat-input').keydown(function(e) {
        if (e.keyCode == 13 && document.getElementById("chat-input").value != "") {
            var date = new Date();
            var data = {
                x: document.getElementById("chat-input").value,
                y: document.getElementById("chat-name").innerHTML + " - ",
                z: (date.getHours() < 13 ? date.getHours() : (date.getHours() - 12)) + ":" + date.getMinutes()
            }

            document.getElementById("chat-input").value = "";
            socket.emit('chat message', data);
            createChatBubble(data, true);
        }
    });

    $('#chat-minimize').click(function(e) {
        if (document.getElementById('chat-window').style.height != "40px")
            document.getElementById('chat-window').style.height = "40px";
        else
            document.getElementById('chat-window').style.height = "371px";
    });

    $('.editable').on('click', function() {
        var $editable = $(this);
        if ($editable.data("editing")) {
            return;
        }

        $editable.data("editing", true);
        var h4 = $("h4", this);
        var input = $('<input style="font-size:1em; margin-top: 2px; margin-left: 3px; font-weight: bold;"/>').val(h4.text());

        h4.after(input);
        h4.hide();

        input.on('blur', function() {
            save();
        })
        input.on('keyup', function(e) {
            if (e.keyCode == '13') {
                save();
            }
            if (e.keyCode == '27') {
                reset();
            }
        })

        function save() {
            h4.text(input.val());
            input.remove();
            h4.show();
            $editable.data("editing", false);
        }

        function reset() {
            input.remove();
            h4.show();
            $editable.data("editing", false);
        }
    })

    socket = io.connect('http://localhost:3000');

    socket.on('mouse', drawPoint);

    socket.on('disengage', function() {
        isDragging = false;
        context.beginPath();
    });

    socket.on('chat message', createChatBubble);

    socket.on('clear', function() {
        context.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on('color', function(color) {
        context.globalCompositeOperation = "source-over";
        context.strokeStyle = color;
        context.fillStyle = color;
        m_color = color;
    });

    socket.on('size', function(size) {
        m_size = size;
        context.lineWidth = m_size * 2;
    });

    socket.on('eraser', function() {
        context.globalCompositeOperation = "destination-out";
        context.strokeStyle = "rgba(0,0,0,1)";
        context.lineWidth = (m_size) * 2;
    });
});

function itemClick(e) {
    switch (e.target.id) {
        case 'item-trash':
            context.clearRect(0, 0, canvas.width, canvas.height);
            socket.emit('clear');
            break;
        case 'item-eraser':
            context.globalCompositeOperation = "destination-out";
            context.strokeStyle = "rgba(0,0,0,1)";
            context.lineWidth = (m_size) * 2;
            socket.emit('eraser');
            break;
        case 'item-color-blue':
            context.globalCompositeOperation = "source-over";
            m_color = "#0000cd";
            context.strokeStyle = m_color;
            context.fillStyle = m_color;
            socket.emit('color', m_color);
            break;
        case 'item-color-red':
            context.globalCompositeOperation = "source-over";
            m_color = "#b22222";
            context.strokeStyle = m_color;
            context.fillStyle = m_color;
            socket.emit('color', m_color);
            break;
        case 'item-color-green':
            context.globalCompositeOperation = "source-over";
            m_color = "#228b22";
            context.strokeStyle = m_color;
            context.fillStyle = m_color;
            socket.emit('color', m_color);
            break;
        case 'item-color-black':
            context.globalCompositeOperation = "source-over";
            m_color = "#000000";
            context.strokeStyle = m_color;
            context.fillStyle = m_color;
            socket.emit('color', m_color);
            break;
        case 'item-size-1':
            m_size = 2;
            context.lineWidth = m_size * 2;
            socket.emit('size', m_size);
            break;
        case 'item-size-2':
            m_size = 4;
            context.lineWidth = m_size * 2;
            socket.emit('size', m_size);
            break;
        case 'item-size-3':
            m_size = 6;
            context.lineWidth = m_size * 2;
            socket.emit('size', m_size);
            break;
    }
}

function createChatBubble(data, isClient = false) {
    var msg = data.x,
        name = data.y,
        stamp = data.z;

    var chatBubble = document.createElement('div');
    chatBubble.className = "chat-bubble";
    if (isClient) {
        //TODO: Add more differentiability between client and non-client chat bubbles. Also add names
        chatBubble.style.backgroundColor = "#3dc476";
    }

    document.getElementById("chat-output").appendChild(chatBubble);
    var bubbleInfo = document.createElement('div');
    bubbleInfo.className = "bubble-info";
    chatBubble.appendChild(bubbleInfo);
    var userName = document.createElement('span');
    userName.class = "user-name";
    userName.innerText = name;
    bubbleInfo.appendChild(userName);
    var timeStamp = document.createElement('span');
    timeStamp.class = "time-stamp";
    timeStamp.innerText = stamp;
    bubbleInfo.appendChild(timeStamp);
    var bubbleText = document.createElement('div');
    bubbleText.class = "bubble-text";
    bubbleText.innerText = msg;
    chatBubble.appendChild(bubbleText);
}

function engage(e) {
    isDragging = true;
    var data = {
        x: e.clientX,
        y: e.clientY
    }
    socket.emit('mouse', data);
    drawPoint(data);
}

function disengage() {
    isDragging = false;
    context.beginPath();

    socket.emit('disengage');
}

function drawPoint(data) {
    context.lineTo(data.x, data.y);
    context.stroke();
    context.beginPath();
    context.arc(data.x, data.y, m_size, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(data.x, data.y);
}