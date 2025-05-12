import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './TicTacToe.css';

// TODO: Replace with your actual server URL
const SERVER_URL = 'http://localhost:3001'; // Assuming server runs on 3001

const TicTacToe = () => {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState('');
  const [roomId, setRoomId] = useState('');
  const [playerSymbol, setPlayerSymbol] = useState('');
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    // Connect to Socket.IO server
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    // Listen for connection confirmation
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setMessage('Connected. Create or join a room.');
    });

    // Listen for game updates
    newSocket.on('gameUpdate', (data) => {
      setBoard(data.board);
      setIsMyTurn(data.turn === playerSymbol);
      setMessage(data.message || (data.turn === playerSymbol ? 'Your turn' : "Opponent's turn"));
      setGameOver(data.gameOver);
      setWinner(data.winner);
      if (data.gameOver) {
        setMessage(data.winner ? `Player ${data.winner} wins!` : 'It\'s a draw!');
      }
    });

    // Listen for room joined confirmation
    newSocket.on('roomJoined', (data) => {
      console.log(`Joined room ${data.roomId} as Player ${data.playerSymbol}`);
      setRoomId(data.roomId);
      setPlayerSymbol(data.playerSymbol);
      setIsMyTurn(data.turn === data.playerSymbol);
      setBoard(data.board);
      setMessage(data.message || (data.turn === data.playerSymbol ? 'Game started! Your turn' : "Game started! Opponent's turn"));
    });

    // Listen for errors
    newSocket.on('error', (errorMessage) => {
      console.error('Socket error:', errorMessage);
      setMessage(`Error: ${errorMessage}`);
    });

    // Listen for opponent disconnect
    newSocket.on('opponentLeft', () => {
        setMessage('Your opponent left the game. You win!');
        setGameOver(true);
        // Optionally reset the game or allow creating/joining a new one
    });

    // Cleanup on component unmount
    return () => {
      newSocket.disconnect();
      console.log('Disconnected from server');
    };
  }, [SERVER_URL, playerSymbol]); // Rerun effect if playerSymbol changes (might need adjustment)

  const handleCreateRoom = () => {
    if (socket && room) {
      console.log(`Attempting to create room: ${room}`);
      socket.emit('createRoom', { roomId: room });
    }
  };

  const handleJoinRoom = () => {
    if (socket && room) {
      console.log(`Attempting to join room: ${room}`);
      socket.emit('joinRoom', { roomId: room });
    }
  };

  const handleMakeMove = (index) => {
    if (!socket || board[index] || !isMyTurn || gameOver) {
      return; // Ignore clicks if not my turn, cell is filled, game is over, or socket not connected
    }
    console.log(`Making move at index ${index}`);
    socket.emit('makeMove', { roomId, index, player: playerSymbol });
  };

  const renderSquare = (index) => (
    <button 
      className="square" 
      onClick={() => handleMakeMove(index)}
      disabled={!isMyTurn || !!board[index] || gameOver}
    >
      {board[index]}
    </button>
  );

  return (
    <div className="tic-tac-toe-container">
      <h1 className="game-title">Multiplayer Tic Tac Toe</h1>
      
      {!roomId ? (
        <div className="room-setup">
          <input 
            type="text" 
            placeholder="Enter Room Name" 
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="room-input"
          />
          <div className='room-buttons'>
            <button onClick={handleCreateRoom} className="room-button">Create Room</button>
            <button onClick={handleJoinRoom} className="room-button">Join Room</button>
          </div>
        </div>
      ) : (
        <div className="game-area">
          <p className="room-info">Room: {roomId} - You are Player: {playerSymbol}</p>
          <div className="board">
            {board.map((_, index) => renderSquare(index))}
          </div>
        </div>
      )}

      <p className="message-display">{message}</p>

      {gameOver && (
        <button onClick={() => { /* TODO: Implement reset/play again logic */ }} className="reset-button">
          Play Again?
        </button>
      )}
    </div>
  );
};

export default TicTacToe;
