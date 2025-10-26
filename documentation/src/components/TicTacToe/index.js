import React, { useState, useEffect, useRef } from 'react';

const TicTacToe = () => {
  const [board, setBoard] = useState(['', '', '', '', '', '', '', '', '']);
  const [player, setPlayer] = useState('X');
  const [winner, setWinner] = useState('');
  const [listening, setListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const playerRef = useRef('X');
  const boardRef = useRef(['', '', '', '', '', '', '', '', '']);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);

  // Text-to-speech function
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  // Get position name for audio announcement
  const getPositionName = (index) => {
    const positionNames = [
      'top left', 'top center', 'top right',
      'middle left', 'center', 'middle right',
      'bottom left', 'bottom center', 'bottom right'
    ];
    return positionNames[index];
  };

  // Convert audio blob to WAV format
  const convertToWav = async (audioBlob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Convert to WAV
      const wavBuffer = audioBufferToWav(audioBuffer);
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

      audioContext.close();
      return wavBlob;
    } catch (error) {
      console.error('Error converting audio:', error);
      throw error;
    }
  };

  // Convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer) => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // "RIFF" chunk descriptor
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    // "fmt " sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // subchunk size
    setUint16(1); // audio format (1 = PCM)
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // byte rate
    setUint16(buffer.numberOfChannels * 2); // block align
    setUint16(16); // bits per sample

    // "data" sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4); // subchunk size

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return arrayBuffer;
  };

  const handleVoiceCommand = (command) => {
    console.log('Voice command:', command);
    setError('');

    const positions = {
      'top left': 0, 'top center': 1, 'top right': 2,
      'middle left': 3, 'center': 4, 'middle right': 5,
      'bottom left': 6, 'bottom center': 7, 'bottom right': 8,
      'one': 0, 'two': 1, 'three': 2, 'four': 3, 'five': 4,
      'six': 5, 'seven': 6, 'eight': 7, 'nine': 8,
      '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
      '6': 5, '7': 6, '8': 7, '9': 8
    };

    let position = positions[command];

    if (position === undefined) {
      for (const [key, value] of Object.entries(positions)) {
        if (command.includes(key)) {
          position = value;
          break;
        }
      }
    }

    if (position !== undefined) {
      console.log('Moving to position:', position, 'Current player:', playerRef.current);
      handleClick(position);
      return;
    }

    if (command === 'new game' || command === 'reset' || command.includes('new game') || command.includes('reset game')) {
      console.log('Resetting game');
      reset();
      return;
    }

    if (command.includes('stop listening')) {
      stopListening();
      return;
    }

    console.log('Command not recognized:', command);
    setError(`Command not recognized: "${command}"`);
  };

  const startListening = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        try {
          // Convert to WAV
          const wavBlob = await convertToWav(audioBlob);
          await sendAudioToAPI(wavBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          setError('Error processing audio');
          speak("Error processing audio");
          setListening(false);
        }

        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setListening(true);
      setIsRecording(true);
      speak("Listening for voice commands");

      // Auto-stop after 3 seconds to capture a command
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 3000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Error accessing microphone');
      speak("Error accessing microphone");
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setListening(false);
    speak("Stopped listening");
  };

  const sendAudioToAPI = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audioFile', audioBlob, 'recording.wav');

      console.log('Sending audio to API...', 'Size:', audioBlob.size, 'bytes');

      const response = await fetch('http://localhost:8080/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (response.status === 300) {
        // Python script failed
        console.error('Python script error:', data.error);
        setError(`Processing failed: ${data.error || 'Unknown error'}`);
        speak("Audio processing failed");
        setListening(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}: ${data.message || 'Unknown error'}`);
      }

      if (data.transcription) {
        console.log('Transcription:', data.transcription);
        handleVoiceCommand(data.transcription.toLowerCase().trim());
      } else {
        setError('No transcription received');
        speak("No transcription received");
      }

      // Ready for next command
      setListening(false);

    } catch (error) {
      console.error('Error sending audio to API:', error);
      setError(`API Error: ${error.message}`);
      speak("Error processing audio");
      setListening(false);
    }
  };

  const checkWinner = (currentBoard = boardRef.current) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a];
      }
    }
    return null;
  };

  const handleClick = (index) => {
    const currentBoard = boardRef.current;
    if (currentBoard[index] || winner) return;

    const currentPlayer = playerRef.current;
    console.log('Current player:', currentPlayer, 'Placing at index:', index);

    const newBoard = [...currentBoard];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    boardRef.current = newBoard;

    const positionName = getPositionName(index);
    speak(`${currentPlayer} has been placed in ${positionName}`);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      console.log('Winner found:', gameWinner);
      setWinner(gameWinner);
      setTimeout(() => {
        speak(`Player ${gameWinner} wins!`);
      }, 1000);
    } else if (newBoard.every(cell => cell !== '')) {
      console.log('Draw - board is full');
      setWinner('draw');
      setTimeout(() => {
        speak("It's a draw!");
      }, 1000);
    } else {
      const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
      console.log('Switching from', currentPlayer, 'to', nextPlayer);
      setPlayer(nextPlayer);
      playerRef.current = nextPlayer;
      setTimeout(() => {
        speak(`It's ${nextPlayer}'s turn`);
      }, 1500);
    }
  };

  const reset = () => {
    const emptyBoard = ['', '', '', '', '', '', '', '', ''];
    setBoard(emptyBoard);
    boardRef.current = emptyBoard;
    setPlayer('X');
    playerRef.current = 'X';
    setWinner('');
    setError('');
    speak("New game started. It's X's turn");
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>Tic Tac Toe with Voice Control</h1>

      {!winner && <h2>Current Player: {player}</h2>}
      {winner && winner !== 'draw' && <h2>Player {winner} wins!</h2>}
      {winner === 'draw' && <h2>It's a draw!</h2>}

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={startListening}
          disabled={listening}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: listening ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: listening ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isRecording ? 'Recording...' : 'Record Command'}
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

      {listening && (
        <p style={{ color: 'red' }}>
          🎤 {isRecording ? 'Recording... (3 seconds)' : 'Processing...'}
        </p>
      )}

      {error && (
        <p style={{ color: 'orange', fontSize: '14px', marginTop: '10px' }}>
          ⚠️ {error}
        </p>
      )}

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
            onClick={() => handleClick(index)}
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
        <p>"top left", "center", "bottom right", "new game"</p>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>
          Note: Make sure your API is running at http://localhost:8080
        </p>
      </div>
    </div>
  );
};

export default TicTacToe;