import speech_recognition as sr
import sys
import io
import json
import wave

recognizer = sr.Recognizer()

try:
    # Read full audio file from stdin (bytes)
    audio_bytes = sys.stdin.buffer.read()
    
    # Detect format from file header or use WAV as default
    audio_format = "WAV"
    if audio_bytes[:4] == b'RIFF':
        audio_format = "WAV"
    elif audio_bytes[:4] == b'fLaC':
        audio_format = "FLAC"
    elif audio_bytes[:4] == b'FORM':
        audio_format = "AIFF"
    
    # Load audio from bytes (handles WAV, FLAC, AIFF, etc.)
    audio_file = io.BytesIO(audio_bytes)
    
    # Try to get duration from WAV file if it's WAV format
    duration = None
    sample_rate = None
    sample_width = None
    
    if audio_format == "WAV":
        try:
            with wave.open(audio_file, 'rb') as wav_file:
                frames = wav_file.getnframes()
                sample_rate = wav_file.getframerate()
                sample_width = wav_file.getsampwidth()
                duration = frames / float(sample_rate)
            audio_file.seek(0)  # Reset to beginning
        except:
            pass
    
    # Load audio for recognition
    with sr.AudioFile(audio_file) as source:
        # Get sample rate if not already set
        if sample_rate is None:
            sample_rate = source.SAMPLE_RATE
        if sample_width is None:
            sample_width = source.SAMPLE_WIDTH
        
        # If we didn't get duration from WAV, try to estimate from audio data
        if duration is None:
            try:
                # Record audio to get its length
                audio = recognizer.record(source)
                # Estimate duration from audio frame data
                # frame_data is raw bytes, so divide by sample_rate * sample_width * channels
                # For mono: duration = len(frame_data) / (sample_rate * sample_width)
                # For stereo: duration = len(frame_data) / (sample_rate * sample_width * 2)
                # We'll assume mono for safety (longer duration estimate)
                duration = len(audio.frame_data) / (sample_rate * sample_width)
            except Exception as e:
                duration = 0
        else:
            # Duration already known, just record audio
            audio = recognizer.record(source)
    
    # Recognize speech using Google
    text = recognizer.recognize_google(audio)
    
    # Output JSON with metadata
    result = {
        "success": True,
        "transcription": text,
        "duration": round(duration, 2) if duration else 0,
        "sample_rate": sample_rate,
        "sample_width": sample_width,
        "format": audio_format
    }
    print(json.dumps(result))

except sr.UnknownValueError:
    result = {
        "success": False,
        "transcription": None,
        "error_code": "UNKNOWN_VALUE",
        "error_message": "Could not understand audio"
    }
    print(json.dumps(result))
    sys.exit(1)
except sr.RequestError as e:
    result = {
        "success": False,
        "transcription": None,
        "error_code": "REQUEST_ERROR",
        "error_message": str(e)
    }
    print(json.dumps(result))
    sys.exit(2)
except Exception as e:
    result = {
        "success": False,
        "transcription": None,
        "error_code": "PROCESSING_ERROR",
        "error_message": str(e)
    }
    print(json.dumps(result))
    sys.exit(3)
