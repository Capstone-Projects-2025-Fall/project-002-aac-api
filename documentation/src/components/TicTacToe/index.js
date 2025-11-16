import React, { useState, useEffect, useRef } from 'react';
//the api library constructor
//name this whatever you want the call the functions using the following syntax
//yourConstructor.libFunction(required data)
const api_lib = require('@smith1552/ciccalone')
const TicTacToe = () => {
  const [board, setBoard] = useState(['', '', '', '', '', '', '', '', '']);
  const [player, setPlayer] = useState('X');
  const [winner, setWinner] = useState('');
  const [listening, setListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const [apiLogs, setApiLogs] = useState([]);
  const [continuousMode, setContinuousMode] = useState(false);
  const playerRef = useRef('X');
  const boardRef = useRef(['', '', '', '', '', '', '', '', '']);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const continuousModeRef = useRef(false);

  // Text-to-speech function
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      //speechSynthesis.speak(utterance);
    }
  };
  

  // Add API log entry
  const addApiLog = (type, data) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now(),
      timestamp,
      type,
      data: JSON.stringify(data, null, 2)
    };
    setApiLogs(prev => [...prev.slice(-4), logEntry]); // Keep last 5 entries
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

    // Log voice command processing
    addApiLog('COMMAND', {
      rawCommand: command,
      currentPlayer: playerRef.current,
      timestamp: new Date().toISOString()
    });

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
      addApiLog('ACTION', {
        action: 'place_mark',
        position: position,
        player: playerRef.current,
        positionName: getPositionName(position)
      });
      handleClick(position);
      return;
    }

    if (command === 'new game' || command === 'reset' || command.includes('new game') || command.includes('reset game')) {
      console.log('Resetting game');
      addApiLog('ACTION', {
        action: 'reset_game',
        command: command
      });
      reset();
      return;
    }

    if (command.includes('stop listening')) {
      addApiLog('ACTION', {
        action: 'stop_listening',
        command: command
      });
      stopContinuousListening();
      return;
    }

    console.log('Command not recognized:', command);
    addApiLog('ERROR', {
      error: 'Command not recognized',
      command: command
    });
    setError(`Command not recognized: "${command}"`);
  };

  // Start continuous listening mode
  const startContinuousListening = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      continuousModeRef.current = true;
      setContinuousMode(true);
      setListening(true);

      speak("Continuous listening activated. I'm always listening for your commands.");
      addApiLog('SYSTEM', {
        message: 'Continuous listening mode started',
        timestamp: new Date().toISOString()
      });

      // Start the recording cycle
      recordNextChunk();

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Error accessing microphone');
      speak("Error accessing microphone");
    }
  };

  // Record and process audio chunks continuously
  const recordNextChunk = () => {
    if (!streamRef.current || !continuousModeRef.current) {
      return;
    }

    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      // Only process if we're still in continuous mode
      if (!continuousModeRef.current) {
        return;
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Only send if audio is substantial (more than 1KB to avoid silence)
      if (audioBlob.size > 1000) {
        setIsRecording(false);
        try {
          const wavBlob = await convertToWav(audioBlob);
          await sendAudioToAPI(wavBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          addApiLog('ERROR', {
            error: 'Audio processing failed',
            message: error.message
          });
        }
      }

      // Schedule next recording chunk if still in continuous mode
      if (continuousModeRef.current) {
        setTimeout(() => {
          recordNextChunk();
        }, 100); // Small delay before next chunk
      }
    };

    mediaRecorder.start();
    setIsRecording(true);

    // Record for 3 seconds then process
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }, 3000);
  };

  // Stop continuous listening mode
  const stopContinuousListening = () => {
    continuousModeRef.current = false;
    setContinuousMode(false);
    setListening(false);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    speak("Continuous listening stopped");
    addApiLog('SYSTEM', {
      message: 'Continuous listening mode stopped',
      timestamp: new Date().toISOString()
    });
  };

  // Original single-shot listening (kept for compatibility)
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
      }, 5000);

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
      //const formData = new FormData();
      //formData.append('audioFile', audioBlob, 'recording.wav');

      console.log('Sending audio to API...', 'Size:', audioBlob.size, 'bytes');

      // Log API request
      addApiLog('REQUEST', {
        method: 'POST',
        url: 'http://localhost:8080/upload',
        contentType: 'multipart/form-data',
        audioSize: `${audioBlob.size} bytes`,
        filename: 'recording.wav'
      });

      //const response = await fetch('http://localhost:8080/upload', {
        //method: 'POST',
        //body: formData
      //});
      //library calls
      const response = await api_lib.sendAudio(audioBlob);
      //this library function only exists due to the next call to addApiLog
      //if we could streamline it we would not require this call at all
      const data = await api_lib.formatData(response)
      console.log('API Response:', data);

      // Log API response
      addApiLog('RESPONSE', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });

      if (response.status === 300) {
        // Python script failed
        console.error('Python script error:', data.error);
        if (!continuousMode) {
          setError(`Processing failed: ${data.error || 'Unknown error'}`);
          speak("Audio processing failed");
          setListening(false);
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}: ${data.message || 'Unknown error'}`);
      }

      if (data.transcription) {
        console.log('Transcription:', data.transcription);
        handleVoiceCommand(data.transcription.toLowerCase().trim());
      } else {
        if (!continuousMode) {
          setError('No transcription received');
          speak("No transcription received");
        }
      }

      // Ready for next command (if not in continuous mode)
      if (!continuousMode) {
        setListening(false);
      }

    } catch (error) {
      console.error('Error sending audio to API:', error);
      if (!continuousMode) {
        setError(`API Error: ${error.message}`);
        speak("Error processing audio");
        setListening(false);
      }
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
    setApiLogs([]); // Clear API logs on reset
    speak("New game started. It's X's turn");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>Tic Tac Toe with Voice Control</h1>

      {!winner && <h2>Current Player: {player}</h2>}
      {winner && winner !== 'draw' && <h2>Player {winner} wins!</h2>}
      {winner === 'draw' && <h2>It's a draw!</h2>}

      <div style={{ marginBottom: '20px' }}>
        {!continuousMode ? (
          <>
            <button
              onClick={startContinuousListening}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Start Continuous Listening
            </button>

            <button
              onClick={startListening}
              disabled={listening}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: listening ? '#cccccc' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: listening ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              {isRecording ? 'Recording...' : 'Single Command'}
            </button>
          </>
        ) : (
          <button
            onClick={stopContinuousListening}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
             Stop Continuous Listening
          </button>
        )}

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

      {continuousMode && (
        <p style={{ color: '#4CAF50', fontWeight: 'bold' }}>
          🎤 ALWAYS LISTENING - {isRecording ? 'Recording...' : 'Processing...'}
        </p>
      )}

      {listening && !continuousMode && (
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
  {board.map((cell, index) => {
    const labels = ['top left', 'top center', 'top right', 
                    'middle left', 'center', 'middle right', 
                    'bottom left', 'bottom center', 'bottom right'];
    
    return (
      <button
        key={index}
        onClick={() => handleClick(index)}
        style={{
          width: '100px',
          height: '100px',
          fontSize: cell ? '30px' : '12px',
          border: '2px solid black',
          backgroundColor: 'white',
          cursor: cell || winner ? 'not-allowed' : 'pointer',
          color: cell ? 'black' : '#999'
        }}
        disabled={cell || winner}
      >
        {cell || labels[index]}
      </button>
    );
  })}
</div>

      {/* API Input/Output Display */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        borderRadius: '8px',
        maxWidth: '800px',
        margin: '30px auto'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>
          🔍 API Input/Output Log
        </h3>
        
        {apiLogs.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No API interactions yet. Try using voice commands!
          </p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {apiLogs.map((log) => (
              <div key={log.id} style={{ 
                marginBottom: '15px', 
                padding: '10px', 
                backgroundColor: 'white', 
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: log.type === 'REQUEST' ? '#007bff' : 
                           log.type === 'RESPONSE' ? '#28a745' :
                           log.type === 'COMMAND' ? '#6f42c1' :
                           log.type === 'ACTION' ? '#fd7e14' :
                           log.type === 'SYSTEM' ? '#17a2b8' :
                           log.type === 'ERROR' ? '#dc3545' : '#6c757d'
                  }}>
                    {log.type}
                  </span>
                  <span style={{ color: '#666', fontSize: '11px' }}>
                    {log.timestamp}
                  </span>
                </div>
                <pre style={{ 
                  margin: 0, 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  fontSize: '11px',
                  color: '#333'
                }}>
                  {log.data}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>Voice Commands:</p>
        <p>"top left", "center", "bottom right", "new game"</p>
        <p style={{ fontSize: '12px', marginTop: '10px', fontStyle: 'italic' }}>
          Continuous mode: Always listening - just speak your commands!
        </p>
      </div>
    </div>
  );
};

export default TicTacToe;