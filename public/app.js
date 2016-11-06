var socket;
var isDragging = false;
var canvas;
var serverCanvas;
var m_size = 2;
var m_color = '#000000';
var clientContext, serverContext;

function init() {
    canvas = document.getElementById("canvas");
    clientContext = canvas.getContext('2d');
    serverCanvas = document.getElementById("server-canvas");
    serverContext = serverCanvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    serverCanvas.width = window.innerWidth;
    serverCanvas.height = window.innerHeight;

    clientContext.lineWidth = m_size * 2;
    clientContext.strokeStyle = m_color;
    clientContext.fillStyle = m_color;
}

$(document).ready(function() {
    init();
    window.addEventListener('resize', init, false);

    $('#canvas').mousedown(engage);

    $('#canvas').mousemove(function(e) {
        if (isDragging)
            engage(e);
    });

    $('#canvas').mouseup(disengage);

    $('#canvas').mouseleave(disengage);

    $('.item').click(itemClick);

    $('.color').click(function(e) {
        document.getElementById("item-eraser").style.backgroundColor = "white";
        var elements = document.getElementsByClassName('color');
        Array.prototype.forEach.call(elements, function(element, index) {
            if (element.id === e.target.id)
                element.style.border = "2pt solid dimgray";
            else
                element.style.border = "";
        });
    });

    $('.size').click(function(e) {
        var elements = document.getElementsByClassName('size');
        Array.prototype.forEach.call(elements, function(element, index) {
            if (element.id === e.target.id)
                element.style.backgroundColor = "lightgray";
            else
                element.style.backgroundColor = "white";
        });
    });

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

    socket = io.connect('https://siteboard.herokuapp.com');

    socket.on('mouse', drawPoint);

    socket.on('disengage', function() {
        isDragging = false;
        serverContext.beginPath();
    });

    socket.on('chat message', createChatBubble);

    socket.on('clear', function() {
        clientContext.clearRect(0, 0, canvas.width, canvas.height);
        serverContext.clearRect(0, 0, serverCanvas.width, serverCanvas.height);
    });

    socket.on('eraser', function() {
        clientContext.globalCompositeOperation = "destination-out";
        clientContext.strokeStyle = "rgba(0,0,0,1)";
        clientContext.lineWidth = (m_size) * 2;

        serverContext.globalCompositeOperation = "destination-out";
        serverContext.strokeStyle = "rgba(0,0,0,1)";
        serverContext.lineWidth = (m_size) * 2;
    });
});

function itemClick(e) {
    switch (e.target.id) {
        case 'item-trash':
            clientContext.clearRect(0, 0, canvas.width, canvas.height);
            serverContext.clearRect(0, 0, serverCanvas.width, serverCanvas.height);
            socket.emit('clear');
            break;
        case 'item-eraser':
            if (e.target.style.backgroundColor === "lightgray")
                e.target.style.backgroundColor = "white";
            else
                e.target.style.backgroundColor = "lightgray";
            
            var elements = document.getElementsByClassName('color');
            Array.prototype.forEach.call(elements, function(element, index) {
                element.style.border = "";
            });

            clientContext.globalCompositeOperation = "destination-out";
            clientContext.strokeStyle = "rgba(0,0,0,1)";
            clientContext.lineWidth = (m_size) * 2;
            socket.emit('eraser');
            break;
        case 'item-color-blue':
            clientContext.globalCompositeOperation = "source-over";
            m_color = "#0000cd";
            clientContext.strokeStyle = m_color;
            clientContext.fillStyle = m_color;
            socket.emit('color', m_color);
            break;
        case 'item-color-red':
            clientContext.globalCompositeOperation = "source-over";
            m_color = "#b22222";
            clientContext.strokeStyle = m_color;
            clientContext.fillStyle = m_color;
            socket.emit('color', m_color);
            break;
        case 'item-color-green':
            clientContext.globalCompositeOperation = "source-over";
            m_color = "#228b22";
            clientContext.strokeStyle = m_color;
            clientContext.fillStyle = m_color;
            socket.emit('color', m_color);
            break;
        case 'item-color-black':
            clientContext.globalCompositeOperation = "source-over";
            m_color = "#000000";
            clientContext.strokeStyle = m_color;
            clientContext.fillStyle = m_color;
            socket.emit('color', m_color);
            break;
        case 'item-size-1':
            m_size = 2;
            clientContext.lineWidth = m_size * 2;
            socket.emit('size', m_size);
            break;
        case 'item-size-2':
            m_size = 4;
            clientContext.lineWidth = m_size * 2;
            socket.emit('size', m_size);
            break;
        case 'item-size-3':
            m_size = 6;
            clientContext.lineWidth = m_size * 2;
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
        chatBubble.style.backgroundColor = "#3dc476";
        chatBubble.style.cssFloat = "right";
        chatBubble.style.marginLeft = (300 - chatBubble.style.minWidth).toString() + "px";
    } else {
        chatBubble.style.cssFloat = "left";
        chatBubble.style.marginRight = (300 - chatBubble.style.minWidth).toString() + "px";
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
        y: e.clientY,
        z: clientContext.strokeStyle,
        a: clientContext.fillStyle,
        b: clientContext.lineWidth,
        c: clientContext.globalCompositeOperation
    }
    socket.emit('mouse', data);
    drawPoint(data, true);
}

function disengage() {
    isDragging = false;
    clientContext.beginPath();

    socket.emit('disengage');
}

function drawPoint(data, isClient = false) {
    if (isClient) {
        clientContext.lineTo(data.x, data.y);
        clientContext.stroke();
        clientContext.beginPath();
        clientContext.arc(data.x, data.y, clientContext.lineWidth / 2, 0, Math.PI * 2);
        clientContext.fill();
        clientContext.beginPath();
        clientContext.moveTo(data.x, data.y);
    }
    else {
        serverContext.strokeStyle = data.z;
        serverContext.fillStyle = data.a;
        serverContext.lineWidth = data.b;
        serverContext.globalCompositeOperation = data.c;

        serverContext.lineTo(data.x, data.y);
        serverContext.stroke();
        serverContext.beginPath();
        serverContext.arc(data.x, data.y, serverContext.lineWidth / 2, 0, Math.PI * 2);
        serverContext.fill();
        serverContext.beginPath();
        serverContext.moveTo(data.x, data.y);
    }
}