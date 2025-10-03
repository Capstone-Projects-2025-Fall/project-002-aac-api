import React, { useState, useEffect } from 'react';

const TicTacToe = () => {
  const [board, setBoard] = useState(['', '', '', '', '', '', '', '', '']);
  const [player, setPlayer] = useState('X');
  const [winner, setWinner] = useState('');
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
        handleVoiceCommand(command);
      };
      
      setRecognition(recognition);
    }
  }, []);

  const handleVoiceCommand = (command) => {
    console.log('Voice command:', command); // Debug log
    
    // Check for position commands FIRST to avoid false matches
    const positions = {
      'top left': 0, 'top center': 1, 'top right': 2,
      'middle left': 3, 'center': 4, 'middle right': 5,
      'bottom left': 6, 'bottom center': 7, 'bottom right': 8,
      'one': 0, 'two': 1, 'three': 2, 'four': 3, 'five': 4,
      'six': 5, 'seven': 6, 'eight': 7, 'nine': 8,
      '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
      '6': 5, '7': 6, '8': 7, '9': 8
    };

    // Try exact match first
    let position = positions[command];
    
    // If no exact match, try partial matches
    if (position === undefined) {
      for (const [key, value] of Object.entries(positions)) {
        if (command.includes(key)) {
          position = value;
          break;
        }
      }
    }
    
    if (position !== undefined) {
      console.log('Moving to position:', position, 'Current player:', player); // Debug log
      handleClick(position, player);
      return;
    }
    
    // Only check for control commands if no position was found
    if (command === 'new game' || command === 'reset' || command.includes('new game') || command.includes('reset game')) {
      console.log('Resetting game'); // Debug log
      reset();
      return;
    }
    
    if (command.includes('stop listening')) {
      stopListening();
      return;
    }
    
    if (command.includes('start listening')) {
      startListening();
      return;
    }
    
    console.log('Command not recognized:', command); // Debug log
  };

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setListening(true);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setListening(false);
    }
  };

  const checkWinner = () => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  const handleClick = (index, currentPlayer = player) => {
    if (board[index] || winner) return;

    console.log('Current player:', currentPlayer, 'Placing at index:', index); // Debug log
    
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameWinner = checkWinner();
    if (gameWinner) {
      setWinner(gameWinner);
    } else {
      const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
      console.log('Switching from', currentPlayer, 'to', nextPlayer); // Debug log
      setPlayer(nextPlayer);
      console.log('Player state updated to:', nextPlayer); // Debug log
    }
  };

  const reset = () => {
    setBoard(['', '', '', '', '', '', '', '', '']);
    setPlayer('X');
    setWinner('');
  };

  console.log('Rendering with player:', player); // Debug log
  
  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>Tic Tac Toe with Voice Control</h1>
      
      {!winner && <h2>Current Player: {player}</h2>}
      {winner && <h2>Player {winner} wins!</h2>}
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={listening ? stopListening : startListening}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: listening ? '#ff4444' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {listening ? 'Stop' : 'Start'}
        </button>
        
        <button 
          onClick={reset}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          New Game
        </button>
      </div>
      
      {listening && <p style={{ color: 'red' }}>🎤 Listening... Say positions like "top left", "center", "bottom right"</p>}
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 100px)', 
        gap: '5px', 
        justifyContent: 'center',
        margin: '20px auto'
      }}>
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => {
              console.log('Button clicked for index:', index, 'Current player:', player);
              handleClick(index);
            }}
            style={{
              width: '100px',
              height: '100px',
              fontSize: '30px',
              border: '2px solid black',
              backgroundColor: 'white',
              cursor: cell || winner ? 'not-allowed' : 'pointer'
            }}
            disabled={cell || winner}
          >
            {cell}
          </button>
        ))}
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>Voice Commands:</p>
        <p>"top left", "center", "bottom right", "new game", "start listening", "stop listening"</p>
      </div>
    </div>
  );
};

export default TicTacToe;
