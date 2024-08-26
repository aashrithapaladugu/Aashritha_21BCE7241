const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Game = require('./game');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const game = new Game();

wss.on('connection', ws => {
    ws.on('message', message => {
        const { type, data } = JSON.parse(message);
        
        switch (type) {
            case 'initialize':
                const { player, characters } = data;
                game.initializePlayer(player, characters);
                break;
            case 'move':
                const { player: movePlayer, character, move } = data;
                const valid = game.move(movePlayer, character, move);
                if (!valid) {
                    ws.send(JSON.stringify({ type: 'invalid-move' }));
                    return;
                }
                break;
        }

        // Broadcast updated game state to all clients
        const gameState = game.getGameState();
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'update', data: gameState }));
            }
        });
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
