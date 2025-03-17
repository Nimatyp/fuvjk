const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html by default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let countdown = 29;
let period = 1;
let history = [];
let currentResult = null;

function generateResult() {
    let randomNum = Math.floor(Math.random() * 10);
    let bigSmall = randomNum >= 5 ? "Big" : "Small";
    let colors = ["Green", "Violet", "Red"];
    let randomColor = colors[Math.floor(Math.random() * colors.length)];

    let result = { period, number: randomNum, bigSmall, color: randomColor };
    history.push(result);
    period++;
    currentResult = result;
    return result;
}

function broadcastGameState() {
    io.emit('gameState', {
        countdown: countdown,
        period: period,
        history: history,
        currentResult: currentResult // Send the current result
    });
}

setInterval(() => {
    if (countdown === 0) {
        const result = generateResult();
        io.emit('newResult', result);
        broadcastGameState();
        countdown = 29;
    } else {
        countdown--;
    }
    broadcastGameState();
}, 1000);

io.on('connection', (socket) => {
    console.log('Client connected');
    socket.emit('history', history);
    socket.emit('countdown', countdown);
    broadcastGameState();

    socket.on('placeBet', (bet) => {
        // Handle bet placement logic here (validate, store, etc.)
        console.log('Bet placed:', bet);
        // You might want to store bets and process them when the round ends
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
