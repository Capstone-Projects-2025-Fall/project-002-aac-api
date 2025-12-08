import React, { useState, useEffect, useRef } from 'react';
import './TicTacToe.css';

/**
 * Rewritten TicTacToe React component using semantic CSS (TicTacToe.css)
 * Logic preserved from original file. See original: uploaded index.js. :contentReference[oaicite:1]{index=1}
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

  // Optimization settings
  const [commandMode, setCommandMode] = useState(true);
  const [skipValidation, setSkipValidation] = useState(true);
  const [skipPreprocessing, setSkipPreprocessing] = useState(false);
  const [simpleFilter, setSimpleFilter] = useState(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // API state
  const [error, setError] = useState('');
  const [apiLogs, setApiLogs] = useState([]);
  const [apiHealth, setApiHealth] = useState(null);
  const [lastConfidence, setLastConfidence] = useState(null);
  const [lastProcessingTime, setLastProcessingTime] = useState(null);
  const [lastService, setLastService] = useState(null);

  // Refs for async operations
  const playerRef = useRef('X');
  const boardRef = useRef(['', '', '', '', '', '', '', '', '']);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const continuousModeRef = useRef(false);

  // API configuration
  const API_BASE_URL = 'http://localhost:8080';

  // ---------- Text-to-Speech ----------
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  // ---------- API Logging ----------
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

  // ---------- Health Check ----------
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
        services: data.services,
        modelStatus: data.modelStatus
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

  useEffect(() => { checkApiHealth(); }, []);

  // ---------- Position Helpers ----------
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
    'one': 0, 'two': 1, 'three': 2, 'four': 3, 'five': 4,
    'six': 5, 'seven': 6, 'eight': 7, 'nine': 8,
    '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
    '6': 5, '7': 6, '8': 7, '9': 8
  };

  // ---------- Audio Processing (unchanged) ----------
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

  // ---------- Voice Command Processing ----------
  const handleVoiceCommand = (command, apiResponse) => {
    console.log('Voice command:', command);
    setError('');

    const aacInfo = apiResponse?.aac || {};
    addApiLog('COMMAND', {
      rawCommand: command,
      currentPlayer: playerRef.current,
      commandType: aacInfo.commandType || 'unknown',
      isCommand: aacInfo.isCommand || false,
      confidence: apiResponse?.confidence
    });

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
      addApiLog('ACTION', {
        action: 'place_mark',
        position: position,
        player: playerRef.current,
        positionName: getPositionName(position)
      });
      handleClick(position);
      return;
    }

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

    if (command.includes('help')) {
      addApiLog('ACTION', { action: 'help', command });
      return;
    }

    console.log('Command not recognized:', command);
    addApiLog('WARNING', {
      message: 'Command not recognized',
      command,
      suggestion: 'Try: top left, center, bottom right, new game'
    });
    setError(`Command not recognized: "${command}"`);
  };

  // ---------- API Communication ----------
  const buildOptimizationHeaders = () => {
    const headers = {};
    if (commandMode) headers['x-command-mode'] = 'true';
    if (skipValidation) headers['x-skip-validation'] = 'true';
    if (skipPreprocessing) headers['x-skip-preprocessing'] = 'true';
    if (simpleFilter) headers['x-simple-filter'] = 'true';
    headers['x-trusted-format'] = 'WAV';
    return headers;
  };

  const getActiveOptimizations = () => {
    const opts = [];
    if (commandMode) opts.push('commandMode');
    if (skipValidation) opts.push('skipValidation');
    if (skipPreprocessing) opts.push('skipPreprocessing');
    if (simpleFilter) opts.push('simpleFilter');
    opts.push('trustedFormat:WAV');
    return opts;
  };

  const sendAudioToAPI = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audioFile', audioBlob, 'recording.wav');

      const headers = buildOptimizationHeaders();
      const activeOpts = getActiveOptimizations();

      addApiLog('REQUEST', {
        method: 'POST',
        url: `${API_BASE_URL}/upload`,
        audioSize: `${audioBlob.size} bytes`,
        optimizations: activeOpts,
        headers: headers
      });

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();

      if (data.confidence !== undefined) setLastConfidence(data.confidence);
      if (data.processingTimeMs !== undefined) setLastProcessingTime(data.processingTimeMs);
      if (data.service) setLastService(data.service);

      addApiLog('RESPONSE', {
        status: response.status,
        success: data.success,
        transcription: data.transcription,
        confidence: data.confidence ? `${(data.confidence * 100).toFixed(1)}%` : 'N/A',
        service: data.service,
        processingTime: data.processingTimeMs ? `${data.processingTimeMs}ms` : 'N/A',
        aac: data.aac,
        wordTiming: data.wordTiming?.length ? `${data.wordTiming.length} words` : 'N/A',
        optimizationsUsed: data.optimizations || activeOpts
      });

      if (!data.success) {
        const errorMsg = data.error?.message || 'Unknown error';
        const errorCode = data.error?.code || 'UNKNOWN';
        if (!continuousMode) {
          setError(`${errorCode}: ${errorMsg}`);
          setListening(false);
        }
        return;
      }

      if (data.transcription) {
        handleVoiceCommand(data.transcription.toLowerCase().trim(), data);
      } else {
        if (!continuousMode) setError('No transcription received');
      }

      if (!continuousMode) setListening(false);
    } catch (error) {
      addApiLog('ERROR', {
        action: 'API request failed',
        error: error.message
      });
      if (!continuousMode) {
        setError(`API Error: ${error.message}`);
        setListening(false);
      }
    }
  };

  // ---------- Recording Functions ----------
  const startContinuousListening = async () => {
    const healthy = await checkApiHealth();
    if (!healthy) {
      setError('API is not available. Please start the server.');
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

      addApiLog('SYSTEM', {
        message: 'Continuous listening started',
        optimizations: getActiveOptimizations()
      });

      recordNextChunk();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Error accessing microphone');
    }
  };

  const recordNextChunk = () => {
    if (!streamRef.current || !continuousModeRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      if (!continuousModeRef.current) return;

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      if (audioBlob.size > 1000) {
        setIsRecording(false);
        try {
          const wavBlob = await convertToWav(audioBlob);
          await sendAudioToAPI(wavBlob);
        } catch (error) {
          addApiLog('ERROR', { error: 'Audio processing failed', message: error.message });
        }
      }

      if (continuousModeRef.current) setTimeout(recordNextChunk, 100);
    };

    mediaRecorder.start();
    setIsRecording(true);

    setTimeout(() => {
      if (mediaRecorder.state === 'recording') mediaRecorder.stop();
    }, 3000);
  };

  const stopContinuousListening = () => {
    continuousModeRef.current = false;
    setContinuousMode(false);
    setListening(false);
    setIsRecording(false);

    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    addApiLog('SYSTEM', { message: 'Continuous listening stopped' });
  };

  const startSingleListening = async () => {
    const healthy = await checkApiHealth();
    if (!healthy) {
      setError('API is not available. Please start the server.');
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
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          const wavBlob = await convertToWav(audioBlob);
          await sendAudioToAPI(wavBlob);
        } catch (error) {
          setError('Error processing audio');
          setListening(false);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setListening(true);
      setIsRecording(true);

      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 4000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Error accessing microphone');
    }
  };

  // ---------- Game Logic ----------
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
    setLastService(null);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  // ---------- Helpers for dynamic classes ----------
  const getStatusClass = () => {
    if (!apiHealth) return 'status-pill error';
    return apiHealth?.status === 'ok' ? 'status-pill ok' : 'status-pill error';
  };

  const getServiceClass = (service) => {
    if (!service) return 'service-pill service-default';
    if (service === 'vosk') return 'service-pill service-vosk';
    if (service === 'google') return 'service-pill service-google';
    return 'service-pill service-default';
  };

  const getConfidenceClass = (conf) => {
    if (conf === null || conf === undefined) return 'confidence-pill';
    if (conf > 0.7) return 'confidence-pill conf-high';
    if (conf > 0.4) return 'confidence-pill conf-mid';
    return 'confidence-pill conf-low';
  };

  const getProcessingClass = (ms) => {
    if (ms === null || ms === undefined) return 'processing-pill';
    if (ms < 500) return 'processing-pill proc-fast';
    if (ms < 1000) return 'processing-pill proc-medium';
    return 'processing-pill proc-slow';
  };

  const getCellClass = (cell) => {
    if (cell === 'X') return 'board-cell x disabled';
    if (cell === 'O') return 'board-cell o disabled';
    return 'board-cell empty';
  };

  const logEntryClass = (type) => {
    const t = (type || '').toLowerCase();
    return `log-entry ${t}`;
  };

  // ---------- Render ----------
  return (
    <div className="app-container">
      <h1 className="app-title">Tic Tac Toe with Voice Control</h1>
      <p className="app-subtitle">AAC Board API Test Interface v2.1</p>

      {/* Status Row */}
      <div className="status-row">
        <div className={getStatusClass()}>
          API: {apiHealth?.status === 'ok' ? ' Connected' : ' Disconnected'}
          {apiHealth?.version && ` (v${apiHealth.version})`}
        </div>

        {apiHealth?.modelStatus?.warmedUp && (
          <div className="models-warmed">Models Warmed Up</div>
        )}

        {lastService && (
          <div className={getServiceClass(lastService)}>
            {lastService.charAt(0).toUpperCase() + lastService.slice(1)}
          </div>
        )}

        {lastConfidence !== null && (
          <div className={getConfidenceClass(lastConfidence)}>
            Confidence: {(lastConfidence * 100).toFixed(0)}%
          </div>
        )}

        {lastProcessingTime !== null && (
          <div className={getProcessingClass(lastProcessingTime)}>
            {lastProcessingTime}ms
          </div>
        )}
      </div>

      {/* Game Status */}
      {!winner && <h2 className="current-player">Current Player: {player}</h2>}
      {winner && winner !== 'draw' && <h2 className="winner">Player {winner} wins!</h2>}
      {winner === 'draw' && <h2 className="draw">It's a draw!</h2>}

      {/* Control Buttons */}
      <div className="controls">
        {!continuousMode ? (
          <>
            <button
              onClick={startContinuousListening}
              className="btn btn-success"
            >
              Start Continuous
            </button>

            <button
              onClick={startSingleListening}
              disabled={listening}
              className={`btn ${listening ? 'disabled' : 'btn-primary'}`}
            >
              {isRecording ? 'Recording...' : 'Single Command'}
            </button>
          </>
        ) : (
          <button
            onClick={stopContinuousListening}
            className="btn btn-danger"
          >
            Stop Listening
          </button>
        )}

        <button onClick={reset} className="btn btn-warning">New Game</button>
        <button onClick={checkApiHealth} className="btn btn-purple">Check API</button>
      </div>

      {/* Optimization Settings */}
      <div>
        <div className="options-row">
          <label
            className={`toggle-label command`}
            title="Command Mode"
          >
            <input
              type="checkbox"
              checked={commandMode}
              onChange={(e) => setCommandMode(e.target.checked)}
            />
            <span>
              <strong>Command Mode</strong>
              <small className="small"> Vosk-first, optimized</small>
            </span>
          </label>

          <label
            className={`toggle-label skip-validation`}
            title="Skip Validation"
          >
            <input
              type="checkbox"
              checked={skipValidation}
              onChange={(e) => setSkipValidation(e.target.checked)}
            />
            <span>
              <strong>Skip Validation</strong>
              <small className="small"> Trusted audio source</small>
            </span>
          </label>

          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="advanced-button"
          >
            {showAdvancedOptions ? 'Hide' : 'More'} Options
          </button>
        </div>

        {showAdvancedOptions && (
          <div className="advanced-options">
            <label className="advanced-toggle">
              <input
                type="checkbox"
                checked={skipPreprocessing}
                onChange={(e) => setSkipPreprocessing(e.target.checked)}
              />
              <span>Skip Preprocessing</span>
            </label>

            <label className="advanced-toggle">
              <input
                type="checkbox"
                checked={simpleFilter}
                onChange={(e) => setSimpleFilter(e.target.checked)}
              />
              <span>Simple Filter</span>
            </label>

            <div className="trusted-format">✓ Trusted Format: WAV</div>
          </div>
        )}

        <div className="active-opts">Active: {getActiveOptimizations().join(', ')}</div>
      </div>

      {/* Status Messages */}
      {continuousMode && (
        <p className="continuous-status">
          ALWAYS LISTENING - {isRecording ? 'Recording...' : 'Processing...'}
        </p>
      )}

      {listening && !continuousMode && (
        <p className="recording-status">
          {isRecording ? 'Recording... (4 seconds)' : 'Processing...'}
        </p>
      )}

      {error && <p className="error-banner">{error}</p>}

      {/* Game Board */}
      <div className="board-grid">
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
              className={getCellClass(cell)}
              disabled={!!cell || !!winner}
              aria-label={labels[index]}
            >
              {cell || labels[index]}
            </button>
          );
        })}
      </div>

      {/* API Log Display */}
      <div className="api-log">
        <div className="log-header">
          <h3 className="log-title">API Log</h3>
          <button onClick={() => setApiLogs([])} className="log-clear-btn">Clear</button>
        </div>

        <div className="log-list">
          {apiLogs.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic', margin: 0 }}>No API activity yet. Try using voice commands!</p>
          ) : (
            apiLogs.map((log) => (
              <div key={log.id} className={logEntryClass(log.type)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="log-type">{log.type}</span>
                  <span className="log-ts">{log.timestamp}</span>
                </div>
                <pre className="log-pre">{log.data}</pre>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h4 style={{ margin: '0 0 10px 0' }}>🗣️ Voice Commands</h4>
        <p className="small"><strong>Positions:</strong> "top left", "center", "bottom right", etc.</p>
        <p className="small"><strong>Numbers:</strong> "one" through "nine" (1-9)</p>
        <p className="small"><strong>Control:</strong> "new game", "reset", "stop listening", "help"</p>

        <h4 style={{ margin: '15px 0 10px 0' }}>⚡ Optimization Tips</h4>
        <p className="small"><strong>Command Mode:</strong> Uses Vosk first (local, faster for short commands)</p>
        <p className="small"><strong>Skip Validation:</strong> Bypasses audio quality checks for trusted sources</p>
        <p className="small"><strong>Simple Filter:</strong> Uses faster single-pole audio filter</p>
      </div>
    </div>
  );
};

export default TicTacToe;
