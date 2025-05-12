import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// In-memory store for game rooms
// Structure: { roomId: { players: { socketId: symbol }, board: [...], turn: 'X', gameOver: false, winner: null } }
const gameRooms = {};

function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // Return 'X' or 'O'
    }
  }
  // Check for draw (no null squares left)
  if (board.every(square => square !== null)) {
    return 'draw';
  }
  return null; // No winner yet
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('createRoom', ({ roomId }) => {
    if (!roomId) {
      socket.emit('error', 'Room ID cannot be empty.');
      return;
    }
    if (gameRooms[roomId]) {
      socket.emit('error', `Room '${roomId}' already exists.`);
      return;
    }

    gameRooms[roomId] = {
      players: { [socket.id]: 'X' }, // First player is 'X'
      board: Array(9).fill(null),
      turn: 'X',
      gameOver: false,
      winner: null,
    };
    socket.join(roomId);
    console.log(`Room '${roomId}' created by ${socket.id}`);
    socket.emit('roomJoined', { 
        roomId, 
        playerSymbol: 'X', 
        board: gameRooms[roomId].board, 
        turn: gameRooms[roomId].turn,
        message: `Room '${roomId}' created. Waiting for opponent...`
    });
  });

  socket.on('joinRoom', ({ roomId }) => {
     if (!roomId) {
      socket.emit('error', 'Room ID cannot be empty.');
      return;
    }
    const room = gameRooms[roomId];
    if (!room) {
      socket.emit('error', `Room '${roomId}' not found.`);
      return;
    }

    const numPlayers = Object.keys(room.players).length;
    if (numPlayers >= 2) {
      socket.emit('error', `Room '${roomId}' is full.`);
      return;
    }

    // Second player joins as 'O'
    room.players[socket.id] = 'O';
    socket.join(roomId);
    console.log(`${socket.id} joined room '${roomId}' as 'O'`);
    
    // Notify the joining player
    socket.emit('roomJoined', { 
        roomId, 
        playerSymbol: 'O', 
        board: room.board, 
        turn: room.turn,
        message: `Joined room '${roomId}'. Game started!`
    });
    
    // Notify both players that the game can start
    io.to(roomId).emit('gameUpdate', { 
        board: room.board, 
        turn: room.turn,
        gameOver: room.gameOver,
        winner: room.winner,
        message: `Player 'O' joined. Player 'X' starts.`
    });
  });

  socket.on('makeMove', ({ roomId, index, player }) => {
    const room = gameRooms[roomId];
    // Basic validation
    if (!room || room.gameOver || room.turn !== player || room.board[index] !== null || !room.players[socket.id] || room.players[socket.id] !== player) {
        console.log(`Invalid move attempt: room=${roomId}, index=${index}, player=${player}, turn=${room?.turn}, socketId=${socket.id}`);
        // Optionally send an error back, but often just ignoring is fine for simple games
        // socket.emit('error', 'Invalid move.'); 
        return; 
    }

    // Make the move
    room.board[index] = player;
    console.log(`Player ${player} made move at index ${index} in room ${roomId}`);

    // Check for winner/draw
    const winner = checkWinner(room.board);
    if (winner) {
        room.gameOver = true;
        room.winner = winner === 'draw' ? 'draw' : winner;
        io.to(roomId).emit('gameUpdate', {
            board: room.board,
            turn: null, // No one's turn
            gameOver: true,
            winner: room.winner,
            message: winner === 'draw' ? "It's a draw!" : `Player ${winner} wins!`
        });
        console.log(`Game over in room ${roomId}. Winner: ${winner}`);
        // Optionally clean up room after a delay?
    } else {
        // Switch turn
        room.turn = player === 'X' ? 'O' : 'X';
        io.to(roomId).emit('gameUpdate', {
            board: room.board,
            turn: room.turn,
            gameOver: false,
            winner: null,
            message: `Player ${room.turn}'s turn`
        });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Find which room the disconnecting player was in
    for (const roomId in gameRooms) {
        const room = gameRooms[roomId];
        if (room.players[socket.id]) {
            console.log(`Player ${socket.id} left room ${roomId}`);
            const leftPlayerSymbol = room.players[socket.id];
            delete room.players[socket.id]; // Remove player

            // If the game wasn't over, notify the remaining player
            if (!room.gameOver) {
                const remainingPlayerId = Object.keys(room.players)[0];
                if (remainingPlayerId) {
                    io.to(remainingPlayerId).emit('opponentLeft');
                    io.to(remainingPlayerId).emit('gameUpdate', { 
                         ...room, // Send last state
                         gameOver: true, 
                         winner: room.players[remainingPlayerId], // Remaining player wins
                         message: `Player ${leftPlayerSymbol} left. You win!`
                    });
                }
                room.gameOver = true; // Mark game as over
                 // Clean up room if empty or game ended
                 if (Object.keys(room.players).length === 0) {
                    console.log(`Room ${roomId} is now empty, deleting.`);
                    delete gameRooms[roomId];
                 } else {
                    // Mark game over if opponent left
                     room.gameOver = true;
                     console.log(`Game in room ${roomId} ended due to player disconnect.`);
                 }

            } else if (Object.keys(room.players).length === 0) {
                 // Clean up room if it's now empty after game was already over
                 console.log(`Room ${roomId} was already over and is now empty, deleting.`);
                 delete gameRooms[roomId];
            }
            break; // Player found, no need to check other rooms
        }
    }
  });
});

// Serve static files from the dist directory
app.use(express.static(join(__dirname, 'dist')));

// Handle admin routes
app.get('/admin*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'admin.html'));
});

// Handle all other routes and serve index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const tryPort = (port) => {
  return new Promise((resolve, reject) => {
    const server = httpServer.listen(port)
      .on('listening', () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log(`Socket.IO listening on port ${port}`);
        resolve(server);
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is busy, trying ${port + 1}...`);
          resolve(tryPort(port + 1));
        } else {
          reject(err);
        }
      });
  });
};

const initialPort = process.env.PORT || 3001;

tryPort(initialPort).catch(err => {
  console.error('Failed to start server:', err);
});
