import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../../utils/speechRecognitionClient';

const ColorGame = () => {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentColor, setCurrentColor] = useState('#ffffff');
  const [colorName, setColorName] = useState('white');
  const [error, setError] = useState('');
  const [lastConfidence, setLastConfidence] = useState(null);
  const [lastSelectedApi, setLastSelectedApi] = useState(null);
  const [apiLogs, setApiLogs] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Color mapping
  const colorMap = {
    'red': '#ff0000',
    'green': '#00ff00',
    'blue': '#0000ff',
    'yellow': '#ffff00',
    'orange': '#ffa500',
    'purple': '#800080',
    'pink': '#ffc0cb',
    'black': '#000000',
    'white': '#ffffff',
    'gray': '#808080',
    'grey': '#808080',
    'brown': '#a52a2a',
    'cyan': '#00ffff',
    'magenta': '#ff00ff',
    'lime': '#00ff00',
    'navy': '#000080',
    'maroon': '#800000',
    'olive': '#808000',
    'teal': '#008080',
    'silver': '#c0c0c0',
    'gold': '#ffd700',
    'coral': '#ff7f50',
    'turquoise': '#40e0d0',
    'violet': '#ee82ee',
    'indigo': '#4b0082'
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
    setApiLogs(prev => [...prev.slice(-9), logEntry]); // Keep last 10 entries
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

    // Set up WAV file header
    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF header
    const writeString = (string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(pos, string.charCodeAt(i));
        pos++;
      }
    };

    writeString('RIFF');
    setUint32(length - 8);
    writeString('WAVE');
    writeString('fmt ');
    setUint32(16); // fmt chunk size
    setUint16(1); // audio format (1 = PCM)
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * buffer.numberOfChannels * 2); // byte rate
    setUint16(buffer.numberOfChannels * 2); // block align
    setUint16(16); // bits per sample
    writeString('data');
    setUint32(length - pos - 4);

    // Get channel data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    // Write PCM samples
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

  // Send audio to API using our npm library
  const sendAudioToAPI = async (audioBlob) => {
    try {
      addApiLog('REQUEST', {
        method: 'transcribeAudio',
        library: 'aac-speech-recognition',
        audioSize: `${audioBlob.size} bytes`
      });

      // Use the library wrapper to transcribe audio
      const result = await transcribeAudio(audioBlob, {
        apiUrl: 'http://localhost:8080/upload',
        speechApis: 'whisper,google,sphinx' // Use all available APIs
      });

      console.log('Library Response:', result);

      // Log API response with confidence scores (from our library)
      addApiLog('RESPONSE', {
        success: result.success,
        transcription: result.transcription,
        confidenceScore: result.confidenceScore,
        selectedApi: result.selectedApi,
        aggregatedConfidenceScore: result.aggregatedConfidenceScore,
        apiResults: result.apiResults
      });

      if (!result.success || result.error) {
        const errorMsg = result.error?.message || result.error?.code || 'Unknown error';
        setError(`Processing failed: ${errorMsg}`);
        addApiLog('ERROR', {
          error: result.error
        });
        return;
      }

      if (result.transcription) {
        console.log('Transcription:', result.transcription);
        console.log('Confidence:', result.confidenceScore, 'API:', result.selectedApi);
        
        // Store confidence info
        if (result.confidenceScore !== null && result.confidenceScore !== undefined) {
          setLastConfidence(result.confidenceScore);
          setLastSelectedApi(result.selectedApi);
          addApiLog('CONFIDENCE', {
            score: result.confidenceScore,
            aggregatedScore: result.aggregatedConfidenceScore,
            selectedApi: result.selectedApi
          });
        }

        // Process color command
        processColorCommand(result.transcription.toLowerCase().trim());
      } else {
        setError('No transcription received');
      }

    } catch (error) {
      console.error('Error transcribing audio with library:', error);
      setError(`Transcription Error: ${error.message}`);
      addApiLog('ERROR', {
        error: error.message,
        code: error.code
      });
    } finally {
      setIsRecording(false);
      setIsListening(false);
    }
  };

  // Process color command
  const processColorCommand = (command) => {
    // Remove common words and clean up
    const cleanCommand = command
      .replace(/change to|set to|make|color|background|bg|the|a|an/gi, '')
      .trim();

    // Try exact match first
    let color = colorMap[cleanCommand];
    
    // Try partial match
    if (!color) {
      for (const [key, value] of Object.entries(colorMap)) {
        if (cleanCommand.includes(key) || key.includes(cleanCommand)) {
          color = value;
          setColorName(key);
          break;
        }
      }
    } else {
      setColorName(cleanCommand);
    }

    if (color) {
      setCurrentColor(color);
      setError('');
      addApiLog('ACTION', {
        action: 'change_color',
        color: color,
        colorName: colorName,
        command: command
      });
    } else {
      setError(`Color "${cleanCommand}" not recognized. Try: red, blue, green, yellow, etc.`);
      addApiLog('ERROR', {
        message: `Unknown color: ${cleanCommand}`
      });
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
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
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsListening(true);

      // Record for 3 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }, 3000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Error accessing microphone. Please allow microphone access.');
    }
  };

  // Reset game
  const reset = () => {
    setCurrentColor('#ffffff');
    setColorName('white');
    setError('');
    setLastConfidence(null);
    setLastSelectedApi(null);
    setApiLogs([]);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentColor,
      transition: 'background-color 0.5s ease',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '600px',
        margin: '0 auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ marginTop: 0, color: '#333' }}>🎨 Color Game</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Say a color name to change the background!
        </p>

        <div style={{ margin: '20px 0' }}>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: currentColor === '#ffffff' || currentColor === '#000000' ? '#333' : currentColor }}>
            Current Color: <span style={{ textTransform: 'capitalize' }}>{colorName}</span>
          </p>
          <div style={{
            width: '100px',
            height: '100px',
            backgroundColor: currentColor,
            border: '2px solid #333',
            borderRadius: '10px',
            margin: '20px auto'
          }} />
        </div>

        {lastConfidence !== null && (
          <div style={{ 
            margin: '15px 0', 
            padding: '10px', 
            backgroundColor: lastConfidence > 0.7 ? '#d4edda' : lastConfidence > 0.5 ? '#fff3cd' : '#f8d7da',
            border: `1px solid ${lastConfidence > 0.7 ? '#c3e6cb' : lastConfidence > 0.5 ? '#ffeaa7' : '#f5c6cb'}`,
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            <span style={{ fontWeight: 'bold' }}>🎯 Confidence: </span>
            <span style={{ color: lastConfidence > 0.7 ? '#155724' : lastConfidence > 0.5 ? '#856404' : '#721c24' }}>
              {(lastConfidence * 100).toFixed(1)}%
            </span>
            {lastSelectedApi && (
              <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                (via {lastSelectedApi})
              </span>
            )}
          </div>
        )}

        <button
          onClick={startRecording}
          disabled={isListening}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            backgroundColor: isListening ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isListening ? 'not-allowed' : 'pointer',
            margin: '10px'
          }}
        >
          {isListening ? (isRecording ? '🎤 Recording... (3s)' : '⏳ Processing...') : '🎤 Say a Color'}
        </button>

        <button
          onClick={reset}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            margin: '10px'
          }}
        >
          Reset
        </button>

        {error && (
          <p style={{ color: '#f44336', fontSize: '14px', marginTop: '15px' }}>
            ⚠️ {error}
          </p>
        )}

        <div style={{ marginTop: '30px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Available Colors:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Object.keys(colorMap).slice(0, 12).map(color => (
              <span key={color} style={{
                padding: '5px 10px',
                backgroundColor: colorMap[color],
                color: ['white', 'yellow', 'cyan', 'lime'].includes(color) ? '#000' : '#fff',
                borderRadius: '5px',
                fontSize: '12px',
                textTransform: 'capitalize'
              }}>
                {color}
              </span>
            ))}
          </div>
        </div>

        {/* API Logs */}
        {apiLogs.length > 0 && (
          <div style={{ 
            marginTop: '30px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #dee2e6', 
            borderRadius: '8px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>🔍 API Logs</h3>
            {apiLogs.map((log) => (
              <div key={log.id} style={{ 
                marginBottom: '10px', 
                padding: '8px', 
                backgroundColor: 'white', 
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                fontSize: '11px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '5px'
                }}>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: log.type === 'REQUEST' ? '#007bff' : 
                           log.type === 'RESPONSE' ? '#28a745' :
                           log.type === 'CONFIDENCE' ? '#20c997' :
                           log.type === 'ACTION' ? '#fd7e14' :
                           log.type === 'ERROR' ? '#dc3545' : '#6c757d'
                  }}>
                    {log.type}
                  </span>
                  <span style={{ color: '#666', fontSize: '10px' }}>
                    {log.timestamp}
                  </span>
                </div>
                <pre style={{ 
                  margin: 0, 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  fontSize: '10px'
                }}>
                  {log.data}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorGame;

