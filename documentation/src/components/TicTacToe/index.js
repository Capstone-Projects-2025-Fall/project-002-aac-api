import React, { useState, useEffect, useRef } from 'react';

/**
 * TicTacToe with Voice Control
 * ============================
 * A voice-controlled Tic Tac Toe game for testing the AAC Board Speech Recognition API.
 * 
 * Features:
 * - Continuous listening mode for hands-free play
 * - Single command mode for one-shot recognition
 * - Command mode toggle for AAC-optimized recognition
 * - Real-time API response display with confidence scores
 * - Word timing visualization
 * - Health check integration
 */

const TicTacToe = () => {
  // Game state
  const [board, setBoard] = useState(['', '', '', '', '', '', '', '', '']);
  const [player, setPlayer] = useState('X');
  const [winner, setWinner] = useState('');
  
  // Voice control state
  const [listening, setListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [commandMode, setCommandMode] = useState(true); // AAC command mode
  
  // API state
  const [error, setError] = useState('');
  const [apiLogs, setApiLogs] = useState([]);
  const [apiHealth, setApiHealth] = useState(null);
  const [lastConfidence, setLastConfidence] = useState(null);
  const [lastProcessingTime, setLastProcessingTime] = useState(null);
  
  // Refs for async operations
  const playerRef = useRef('X');
  const boardRef = useRef(['', '', '', '', '', '', '', '', '']);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const continuousModeRef = useRef(false);

  // API configuration
  const API_BASE_URL = 'http://localhost:8080';

  // ==========================================================================
  // Text-to-Speech
  // ==========================================================================

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  // ==========================================================================
  // API Logging
  // ==========================================================================

  const addApiLog = (type, data) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now(),
      timestamp,
      type,
      data: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    };
    setApiLogs(prev => [...prev.slice(-9), logEntry]); // Keep last 10 entries
  };

  // ==========================================================================
  // Health Check
  // ==========================================================================

  const checkApiHealth = async () => {
    try {
      addApiLog('HEALTH', { action: 'Checking API health...' });
      
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      
      setApiHealth(data);
      addApiLog('HEALTH', {
        status: data.status,
        uptime: data.uptimeFormatted,
        version: data.version,
        services: data.services
      });
      
      return data.status === 'ok';
    } catch (error) {
      setApiHealth({ status: 'error', error: error.message });
      addApiLog('ERROR', { 
        action: 'Health check failed',
        error: error.message 
      });
      return false;
    }
  };

  // Check health on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  // ==========================================================================
  // Position Helpers
  // ==========================================================================

  const getPositionName = (index) => {
    const positionNames = [
      'top left', 'top center', 'top right',
      'middle left', 'center', 'middle right',
      'bottom left', 'bottom center', 'bottom right'
    ];
    return positionNames[index];
  };

  const positions = {
    'top left': 0, 'top center': 1, 'top right': 2,
    'middle left': 3, 'center': 4, 'middle right': 5,
    'bottom left': 6, 'bottom center': 7, 'bottom right': 8,
    // Number words
    'one': 0, 'two': 1, 'three': 2, 'four': 3, 'five': 4,
    'six': 5, 'seven': 6, 'eight': 7, 'nine': 8,
    // Digits
    '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
    '6': 5, '7': 6, '8': 7, '9': 8
  };

  // ==========================================================================
  // Audio Processing
  // ==========================================================================

  const convertToWav = async (audioBlob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const wavBuffer = audioBufferToWav(audioBuffer);
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      audioContext.close();
      return wavBlob;
    } catch (error) {
      console.error('Error converting audio:', error);
      throw error;
    }
  };

  const audioBufferToWav = (buffer) => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    const setUint16 = (data) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data) => { view.setUint32(pos, data, true); pos += 4; };

    // RIFF header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"

    // fmt chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1); // PCM
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
    setUint16(buffer.numberOfChannels * 2);
    setUint16(16);

    // data chunk
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

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

  // ==========================================================================
  // Voice Command Processing
  // ==========================================================================

  const handleVoiceCommand = (command, apiResponse) => {
    console.log('Voice command:', command);
    setError('');

    // Log with AAC info if available
    const aacInfo = apiResponse?.aac || {};
    addApiLog('COMMAND', {
      rawCommand: command,
      currentPlayer: playerRef.current,
      commandType: aacInfo.commandType || 'unknown',
      isCommand: aacInfo.isCommand || false,
      confidence: apiResponse?.confidence
    });

    // Find position from command
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

    // Game control commands
    if (command === 'new game' || command === 'reset' || 
        command.includes('new game') || command.includes('reset game') ||
        command.includes('start over')) {
      addApiLog('ACTION', { action: 'reset_game', command });
      reset();
      return;
    }

    if (command.includes('stop listening') || command.includes('stop')) {
      addApiLog('ACTION', { action: 'stop_listening', command });
      stopContinuousListening();
      return;
    }

    // Help command
    if (command.includes('help')) {
     // speak("Say a position like top left, center, or bottom right. Or say new game to restart.");
      addApiLog('ACTION', { action: 'help', command });
      return;
    }

    console.log('Command not recognized:', command);
    addApiLog('WARNING', {
      message: 'Command not recognized',
      command: command,
      suggestion: 'Try: top left, center, bottom right, new game'
    });
    setError(`Command not recognized: "${command}"`);
  };

  // ==========================================================================
  // API Communication
  // ==========================================================================

  const sendAudioToAPI = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audioFile', audioBlob, 'recording.wav');

      // Log request
      addApiLog('REQUEST', {
        method: 'POST',
        url: `${API_BASE_URL}/upload`,
        audioSize: `${audioBlob.size} bytes`,
        commandMode: commandMode,
        headers: commandMode ? { 'x-command-mode': 'true' } : {}
      });

      // Build headers
      const headers = {};
      if (commandMode) {
        headers['x-command-mode'] = 'true';
      }

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();
      console.log('API Response:', data);

      // Update stats from new camelCase response format
      if (data.confidence !== undefined) {
        setLastConfidence(data.confidence);
      }
      if (data.processingTimeMs !== undefined) {
        setLastProcessingTime(data.processingTimeMs);
      }

      // Log response with new format
      addApiLog('RESPONSE', {
        status: response.status,
        success: data.success,
        transcription: data.transcription,
        confidence: data.confidence ? `${(data.confidence * 100).toFixed(1)}%` : 'N/A',
        service: data.service,
        processingTime: data.processingTimeMs ? `${data.processingTimeMs}ms` : 'N/A',
        aac: data.aac,
        wordTiming: data.wordTiming?.length ? `${data.wordTiming.length} words` : 'N/A'
      });

      // Handle errors (new format uses success boolean)
      if (!data.success) {
        const errorMsg = data.error?.message || 'Unknown error';
        const errorCode = data.error?.code || 'UNKNOWN';
        console.error('API error:', errorCode, errorMsg);
        
        if (!continuousMode) {
          setError(`${errorCode}: ${errorMsg}`);
          // speak("Could not understand audio");
          setListening(false);
        }
        return;
      }

      // Process successful transcription
      if (data.transcription) {
        console.log('Transcription:', data.transcription);
        handleVoiceCommand(data.transcription.toLowerCase().trim(), data);
      } else {
        if (!continuousMode) {
          setError('No transcription received');
         // speak("No transcription received");
        }
      }

      if (!continuousMode) {
        setListening(false);
      }

    } catch (error) {
      console.error('Error sending audio to API:', error);
      addApiLog('ERROR', {
        action: 'API request failed',
        error: error.message
      });
      
      if (!continuousMode) {
        setError(`API Error: ${error.message}`);
        speak("Error connecting to server");
        setListening(false);
      }
    }
  };

  // ==========================================================================
  // Recording Functions
  // ==========================================================================

  const startContinuousListening = async () => {
    // Check API health first
    const healthy = await checkApiHealth();
    if (!healthy) {
      setError('API is not available. Please start the server.');
      // speak("API server is not available");
      return;
    }

    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      continuousModeRef.current = true;
      setContinuousMode(true);
      setListening(true);

      // speak("Continuous listening activated");
      addApiLog('SYSTEM', {
        message: 'Continuous listening started',
        commandMode: commandMode
      });

      recordNextChunk();

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Error accessing microphone');
      // speak("Error accessing microphone");
    }
  };

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
      if (!continuousModeRef.current) return;

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Only process if audio is substantial
      if (audioBlob.size > 1000) {
        setIsRecording(false);
        try {
          const wavBlob = await convertToWav(audioBlob);
          await sendAudioToAPI(wavBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          addApiLog('ERROR', { error: 'Audio processing failed', message: error.message });
        }
      }

      // Continue recording if still in continuous mode
      if (continuousModeRef.current) {
        setTimeout(recordNextChunk, 100);
      }
    };

    mediaRecorder.start();
    setIsRecording(true);

    // Record for 3 seconds
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }, 3000);
  };

  const stopContinuousListening = () => {
    continuousModeRef.current = false;
    setContinuousMode(false);
    setListening(false);
    setIsRecording(false);

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // speak("Stopped listening");
    addApiLog('SYSTEM', { message: 'Continuous listening stopped' });
  };

  const startSingleListening = async () => {
    // Check API health first
    const healthy = await checkApiHealth();
    if (!healthy) {
      setError('API is not available. Please start the server.');
      // speak("API server is not available");
      return;
    }

    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

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
          const wavBlob = await convertToWav(audioBlob);
          await sendAudioToAPI(wavBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          setError('Error processing audio');
          // speak("Error processing audio");
          setListening(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setListening(true);
      setIsRecording(true);
      speak("Listening");

      // Auto-stop after 4 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 4000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Error accessing microphone');
      // speak("Error accessing microphone");
    }
  };

  // ==========================================================================
  // Game Logic
  // ==========================================================================

  const checkWinner = (currentBoard = boardRef.current) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const [a, b, c] of lines) {
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
    const newBoard = [...currentBoard];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    boardRef.current = newBoard;

    const positionName = getPositionName(index);
    // speak(`${currentPlayer} placed in ${positionName}`);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      setTimeout(() => speak(`Player ${gameWinner} wins!`), 1000);
    } else if (newBoard.every(cell => cell !== '')) {
      setWinner('draw');
      setTimeout(() => speak("It's a draw!"), 1000);
    } else {
      const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
      setPlayer(nextPlayer);
      playerRef.current = nextPlayer;
      setTimeout(() => speak(`${nextPlayer}'s turn`), 1000);
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
    setLastConfidence(null);
    setLastProcessingTime(null);
    // speak("New game. X's turn");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ==========================================================================
  // Render
  // ==========================================================================

  const getLogColor = (type) => {
    const colors = {
      REQUEST: '#007bff',
      RESPONSE: '#28a745',
      COMMAND: '#6f42c1',
      ACTION: '#fd7e14',
      SYSTEM: '#17a2b8',
      HEALTH: '#20c997',
      WARNING: '#ffc107',
      ERROR: '#dc3545'
    };
    return colors[type] || '#6c757d';
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1 style={{ marginBottom: '10px' }}>🎮 Tic Tac Toe with Voice Control</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>AAC Board API Test Interface</p>

      {/* API Status Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          padding: '8px 16px',
          backgroundColor: apiHealth?.status === 'ok' ? '#d4edda' : '#f8d7da',
          borderRadius: '20px',
          fontSize: '14px'
        }}>
          API: {apiHealth?.status === 'ok' ? '✅ Connected' : '❌ Disconnected'}
          {apiHealth?.version && ` (v${apiHealth.version})`}
        </div>
        
        {lastConfidence !== null && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: lastConfidence > 0.7 ? '#d4edda' : lastConfidence > 0.4 ? '#fff3cd' : '#f8d7da',
            borderRadius: '20px',
            fontSize: '14px'
          }}>
            Confidence: {(lastConfidence * 100).toFixed(0)}%
          </div>
        )}
        
        {lastProcessingTime !== null && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: lastProcessingTime < 1000 ? '#d4edda' : '#fff3cd',
            borderRadius: '20px',
            fontSize: '14px'
          }}>
            ⏱️ {lastProcessingTime}ms
          </div>
        )}
      </div>

      {/* Game Status */}
      {!winner && <h2>Current Player: {player}</h2>}
      {winner && winner !== 'draw' && <h2 style={{ color: '#28a745' }}>🎉 Player {winner} wins!</h2>}
      {winner === 'draw' && <h2 style={{ color: '#ffc107' }}>🤝 It's a draw!</h2>}

      {/* Control Buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {!continuousMode ? (
          <>
            <button
              onClick={startContinuousListening}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🎤 Start Continuous
            </button>

            <button
              onClick={startSingleListening}
              disabled={listening}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: listening ? '#cccccc' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: listening ? 'not-allowed' : 'pointer'
              }}
            >
              {isRecording ? '🔴 Recording...' : '🎙️ Single Command'}
            </button>
          </>
        ) : (
          <button
            onClick={stopContinuousListening}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ⏹️ Stop Listening
          </button>
        )}

        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🔄 New Game
        </button>

        <button
          onClick={checkApiHealth}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🔍 Check API
        </button>
      </div>

      {/* Command Mode Toggle */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '10px',
          cursor: 'pointer',
          padding: '8px 16px',
          backgroundColor: commandMode ? '#e3f2fd' : '#f5f5f5',
          borderRadius: '8px',
          border: `2px solid ${commandMode ? '#2196F3' : '#ddd'}`
        }}>
          <input
            type="checkbox"
            checked={commandMode}
            onChange={(e) => setCommandMode(e.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
          <span>
            <strong>AAC Command Mode</strong>
            <br />
            <small style={{ color: '#666' }}>Optimized for short commands</small>
          </span>
        </label>
      </div>

      {/* Status Messages */}
      {continuousMode && (
        <p style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '18px' }}>
           ALWAYS LISTENING - {isRecording ? '🔴 Recording...' : '⏳ Processing...'}
        </p>
      )}

      {listening && !continuousMode && (
        <p style={{ color: '#2196F3', fontWeight: 'bold' }}>
          🎤 {isRecording ? 'Recording... (4 seconds)' : 'Processing...'}
        </p>
      )}

      {error && (
        <p style={{ 
          color: '#dc3545', 
          backgroundColor: '#f8d7da', 
          padding: '10px 20px', 
          borderRadius: '8px',
          display: 'inline-block'
        }}>
          ⚠️ {error}
        </p>
      )}

      {/* Game Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 100px)',
        gap: '5px',
        justifyContent: 'center',
        margin: '20px auto'
      }}>
        {board.map((cell, index) => {
          const labels = [
            'top left', 'top center', 'top right',
            'middle left', 'center', 'middle right',
            'bottom left', 'bottom center', 'bottom right'
          ];

          return (
            <button
              key={index}
              onClick={() => handleClick(index)}
              style={{
                width: '100px',
                height: '100px',
                fontSize: cell ? '36px' : '11px',
                fontWeight: cell ? 'bold' : 'normal',
                border: '2px solid #333',
                backgroundColor: cell ? (cell === 'X' ? '#e3f2fd' : '#fce4ec') : 'white',
                cursor: cell || winner ? 'not-allowed' : 'pointer',
                color: cell ? (cell === 'X' ? '#1976d2' : '#c2185b') : '#999',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
              disabled={!!cell || !!winner}
            >
              {cell || labels[index]}
            </button>
          );
        })}
      </div>

      {/* API Log Display */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: '8px',
        maxWidth: '900px',
        margin: '30px auto',
        textAlign: 'left'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>
            📡 API Log
          </h3>
          <button
            onClick={() => setApiLogs([])}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {apiLogs.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic', margin: 0 }}>
              No API activity yet. Try using voice commands!
            </p>
          ) : (
            apiLogs.map((log) => (
              <div key={log.id} style={{
                marginBottom: '8px',
                padding: '8px 12px',
                backgroundColor: '#2d2d2d',
                borderLeft: `3px solid ${getLogColor(log.type)}`,
                borderRadius: '4px',
                fontFamily: 'Monaco, Consolas, monospace',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: getLogColor(log.type), fontWeight: 'bold' }}>
                    {log.type}
                  </span>
                  <span style={{ color: '#666' }}>{log.timestamp}</span>
                </div>
                <pre style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#d4d4d4'
                }}>
                  {log.data}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Help Section */}
      <div style={{ 
        marginTop: '20px', 
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        maxWidth: '600px',
        margin: '20px auto'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>🗣️ Voice Commands</h4>
        <p style={{ margin: '5px 0', color: '#555' }}>
          <strong>Positions:</strong> "top left", "center", "bottom right", etc.
        </p>
        <p style={{ margin: '5px 0', color: '#555' }}>
          <strong>Numbers:</strong> "one" through "nine" (1-9)
        </p>
        <p style={{ margin: '5px 0', color: '#555' }}>
          <strong>Control:</strong> "new game", "reset", "stop listening", "help"
        </p>
      </div>
    </div>
  );
};

export default TicTacToe;