"""
AAC Board Speech Recognition Module
===================================
Optimized speech recognition for AAC (Augmentative and Alternative Communication) devices.

Features:
- Multiple recognition backends (Google, Vosk offline)
- Command mode with limited vocabulary for faster recognition
- Word-level timing information
- Standardized camelCase JSON responses
- Audio quality validation
- Optimized for low-latency AAC interactions

Author: Gio, improvements for AAC optimization
"""

import speech_recognition as sr
import sys
import io
import json
import wave
import numpy as np
from scipy import signal
import audioop
import os
import time
from typing import Optional, Dict, List, Any, Tuple

# Vosk imports
vosk = None
VOSK_MODEL = None  # Store loaded model globally
vosk_model_path = os.environ.get('VOSK_MODEL_PATH', 'model/vosk-model-small-en-us-0.15') # Path to Vosk model

# =============================================================================
# AAC Command Configuration
# =============================================================================

# Common AAC commands for command mode recognition
AAC_COMMANDS = [
    # Navigation
    "yes", "no", "help", "back", "next", "previous", "home", "menu", "exit", "stop",
    # Selection
    "select", "choose", "pick", "open", "close", "cancel", "confirm", "delete", "this"
    # Communication
    "hello", "goodbye", "thank you", "please", "sorry", "wait", "more", "done",
    # Actions
    "play", "pause", "repeat", "louder", "quieter", "up", "down", "left", "right", "top"
    # Game Actions
    "center", "middle right", "middle left", "bottom right", "bottom center", "bottom left", "top left", "top center", "top right"
]

# Command categories for response classification
COMMAND_CATEGORIES = {
    "navigation": ["back", "next", "previous", "home", "menu", "exit", "up", "down", "left", "right"],
    "selection": ["select", "choose", "pick", "open", "close", "cancel", "confirm", "delete", "yes", "no"],
    "communication": ["hello", "goodbye", "thank you", "please", "sorry", "wait", "more", "done", "help"],
    "media": ["play", "pause", "stop", "repeat", "louder", "quieter"]
}

# Supported audio formats with optimal settings
SUPPORTED_FORMATS = {
    "WAV": {"extensions": [".wav"], "optimal_sample_rate": 16000, "optimal_bit_depth": 16},
    "MP3": {"extensions": [".mp3"], "optimal_sample_rate": 16000, "optimal_bit_depth": 16},
    "FLAC": {"extensions": [".flac"], "optimal_sample_rate": 16000, "optimal_bit_depth": 16},
    "OGG": {"extensions": [".ogg"], "optimal_sample_rate": 16000, "optimal_bit_depth": 16},
    "RAW": {"extensions": [".raw", ".pcm"], "optimal_sample_rate": 16000, "optimal_bit_depth": 16}
}


# =============================================================================
# Model Loading and Initialization
# =============================================================================

def load_vosk_model(model_path: str) -> Optional[Any]:
    """
    Load Vosk model for offline recognition.
    
    Args:
        model_path: Path to the Vosk model directory
        
    Returns:
        Loaded Vosk model or None if loading fails
    """
    global vosk, VOSK_MODEL

    # Return cached model if already loaded
    if VOSK_MODEL is not None:
        return VOSK_MODEL

    try:
        import vosk as vosk_module
        vosk = vosk_module
        vosk.SetLogLevel(-1)  # Reduce Vosk logging noise
        
        if not os.path.exists(model_path):
            log_debug(f"Vosk model not found at {model_path}")
            return None
        
        log_debug(f"Loading Vosk model from {model_path}...")
        start_time = time.time()
        VOSK_MODEL = vosk.Model(model_path)
        load_time = (time.time() - start_time) * 1000
        log_debug(f"Vosk model loaded in {load_time:.0f}ms")
        return VOSK_MODEL
        
    except ImportError:
        log_debug("Vosk module not found. Install: pip install vosk")
        return None
    except Exception as e:
        log_debug(f"Failed to load Vosk model: {e}")
        return None


def get_model_status() -> Dict[str, Any]:
    """Get current model loading status for health checks."""
    return {
        "voskLoaded": VOSK_MODEL is not None,
        "voskModelPath": vosk_model_path,
        "voskAvailable": vosk is not None
    }


def warm_up_models() -> Dict[str, bool]:
    """
    Warm up recognition models to reduce first-request latency.
    Call this on server startup.
    
    Returns:
        Dictionary with warm-up status for each model
    """
    results = {"vosk": False}
    
    # Warm up Vosk
    model = load_vosk_model(vosk_model_path)
    if model is not None:
        try:
            # Create a short silent audio to initialize recognizer
            sample_rate = 16000
            silent_audio = bytes(sample_rate * 2)  # 1 second of silence (16-bit)
            rec = vosk.KaldiRecognizer(model, sample_rate)
            rec.AcceptWaveform(silent_audio)
            rec.FinalResult()
            results["vosk"] = True
            log_debug("Vosk model warmed up successfully")
        except Exception as e:
            log_debug(f"Vosk warm-up failed: {e}")
    
    return results


# =============================================================================
# Logging Utilities
# =============================================================================

def log_debug(message: str) -> None:
    """Print debug message to stderr."""
    print(message, file=sys.stderr)


# =============================================================================
# Audio Processing
# =============================================================================

def detect_audio_format(audio_bytes: bytes) -> str:
    """
    Detect audio format from byte stream.
    
    Args:
        audio_bytes: Raw audio bytes
        
    Returns:
        Format string (WAV, MP3, FLAC, OGG, or UNKNOWN)
    """
    if len(audio_bytes) < 12:
        return 'UNKNOWN'
    
    if audio_bytes.startswith(b'RIFF') and audio_bytes[8:12] == b'WAVE':
        return 'WAV'
    elif audio_bytes[0:3] == b'ID3' or audio_bytes[0:2] == b'\xff\xfb':
        return 'MP3'
    elif audio_bytes[0:4] == b'fLaC':
        return 'FLAC'
    elif audio_bytes[0:4] == b'OggS':
        return 'OGG'
    else:
        return 'UNKNOWN'


def get_wav_metadata(audio_file: io.BytesIO) -> Dict[str, Any]:
    """
    Extract metadata from WAV audio file.
    
    Args:
        audio_file: BytesIO object containing WAV data
        
    Returns:
        Dictionary with audio metadata
    """
    metadata = {}
    try:
        audio_file.seek(0)
        with wave.open(audio_file, 'rb') as wf:
            sample_rate = wf.getframerate()
            sample_width = wf.getsampwidth()
            channels = wf.getnchannels()
            frames = wf.getnframes()
            duration = frames / float(sample_rate) if sample_rate > 0 else 0
            metadata = {
                'duration': round(duration, 3),
                'sampleRate': sample_rate,
                'sampleWidth': sample_width,
                'channels': channels,
                'format': 'WAV',
                'frames': frames
            }
    except Exception as e:
        log_debug(f"Failed to extract WAV metadata: {e}")
    return metadata


def preprocess_audio(recognizer: sr.Recognizer, audio: sr.AudioData) -> sr.AudioData:
    """
    Preprocess audio data for better recognition in AAC context.
    
    Applies high-pass filter to remove low-frequency noise common in
    AAC device environments (HVAC, motor noise, etc.)
    
    Args:
        recognizer: SpeechRecognition Recognizer instance
        audio: AudioData to preprocess
        
    Returns:
        Preprocessed AudioData
    """
    try:
        # Convert to numpy array for processing
        raw_data = np.frombuffer(audio.frame_data, np.int16)
        
        if len(raw_data) == 0:
            return audio
        
        # Apply high-pass filter to remove low frequency noise
        nyquist = audio.sample_rate / 2
        low_cutoff = 80  # Remove frequencies below 80Hz (common noise floor)
        normal_cutoff = low_cutoff / nyquist
        
        # Check if cutoff is valid
        if normal_cutoff >= 1.0 or normal_cutoff <= 0:
            log_debug("Warning: Invalid cutoff frequency, skipping filter")
            return audio
        
        # Design and apply Butterworth high-pass filter
        b, a = signal.butter(4, normal_cutoff, btype='high', analog=False)
        filtered_data = signal.filtfilt(b, a, raw_data)

        # Normalize audio to prevent clipping
        max_val = np.max(np.abs(filtered_data))
        if max_val > 0:
            filtered_data = filtered_data * (32767 * 0.9 / max_val)

        # Ensure data is in valid range
        filtered_data = np.clip(filtered_data, -32768, 32767)

        # Create new AudioData with processed audio
        processed_audio = sr.AudioData(
            filtered_data.astype(np.int16).tobytes(),
            audio.sample_rate,
            audio.sample_width
        )
        return processed_audio
        
    except Exception as e:
        log_debug(f"Preprocessing failed: {e}, using original audio")
        return audio


def adjust_ambient_noise(recognizer: sr.Recognizer, source: sr.AudioSource, duration: float = 0.3) -> None:
    """
    Adjust for ambient noise in the audio source.
    Uses shorter duration for faster AAC response times.
    
    Args:
        recognizer: SpeechRecognition Recognizer instance
        source: Audio source to calibrate
        duration: Calibration duration in seconds (default 0.3 for AAC speed)
    """
    try:
        recognizer.adjust_for_ambient_noise(source, duration=min(duration, 0.5))
    except Exception:
        # If calibration fails, use optimized default for AAC devices
        recognizer.energy_threshold = 350


def validate_audio_quality(audio: sr.AudioData, sample_rate: int, duration: float) -> Dict[str, Any]:
    """
    Validate audio quality for AAC context.
    
    Args:
        audio: AudioData to validate
        sample_rate: Audio sample rate
        duration: Audio duration in seconds
        
    Returns:
        Dictionary with validation results
    """
    issues = []
    warnings = []

    # Check duration
    if duration < 0.1:
        issues.append("Audio too short (< 0.1s)")
    elif duration < 0.3:
        warnings.append("Audio may be too short for reliable recognition")
    elif duration > 30:
        warnings.append("Long audio may increase processing time")
    
    # Check if audio has content (not silent)
    try:
        rms = audioop.rms(audio.frame_data, audio.sample_width)
        if rms < 50:
            issues.append("Audio appears silent or nearly silent")
        elif rms < 200:
            warnings.append("Audio volume is low")
    except Exception:
        warnings.append("Could not analyze audio volume")
    
    # Check sample rate
    if sample_rate < 8000:
        issues.append("Sample rate too low (< 8kHz)")
    elif sample_rate < 16000:
        warnings.append("Sample rate below optimal (16kHz recommended)")
    
    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings
    }


# =============================================================================
# Speech Recognition
# =============================================================================

def recognize_vosk(audio_data: sr.AudioData, model: Any, command_mode: bool = False) -> Tuple[str, float, Dict]:
    """
    Recognize speech using Vosk offline model.
    
    Args:
        audio_data: AudioData to recognize
        model: Loaded Vosk model
        command_mode: If True, use limited AAC command vocabulary
        
    Returns:
        Tuple of (transcription, confidence, full_result)
    """
    if vosk is None or model is None:
        raise RuntimeError("Vosk model is not loaded")

    rec = vosk.KaldiRecognizer(model, audio_data.sample_rate)
    rec.SetMaxAlternatives(3)
    rec.SetWords(True)
    
    # Apply command grammar if in command mode
    if command_mode:
        grammar = json.dumps(AAC_COMMANDS)
        try:
            rec = vosk.KaldiRecognizer(model, audio_data.sample_rate, grammar)
            rec.SetWords(True)
        except Exception as e:
            log_debug(f"Failed to set command grammar: {e}")

    # Process audio in chunks for better streaming compatibility
    chunk_size = 4000
    audio_bytes = audio_data.frame_data
    
    for i in range(0, len(audio_bytes), chunk_size):
        chunk = audio_bytes[i:i+chunk_size]
        rec.AcceptWaveform(chunk)

    # Finalize recognition
    result = json.loads(rec.FinalResult())
    text = result.get('text', '').strip()

    # Calculate confidence
    confidence = 0.5
    if 'alternatives' in result and result['alternatives']:
        confidence = result['alternatives'][0].get('confidence', 0.5)
    elif 'result' in result and result['result']:
        word_confidences = [word.get('conf', 0.5) for word in result['result']]
        if word_confidences:
            confidence = sum(word_confidences) / len(word_confidences)
    
    return text, confidence, result


def classify_command(text: str) -> Optional[str]:
    """
    Classify recognized text into AAC command category.
    
    Args:
        text: Recognized text
        
    Returns:
        Command category or None if not a recognized command
    """
    if not text:
        return None
    
    text_lower = text.lower().strip()
    words = text_lower.split()
    
    for category, commands in COMMAND_CATEGORIES.items():
        for word in words:
            if word in commands:
                return category
    
    return "freeform"


def extract_word_timing(vosk_result: Dict) -> List[Dict[str, Any]]:
    """
    Extract word-level timing information from Vosk result.
    
    Args:
        vosk_result: Full Vosk recognition result
        
    Returns:
        List of word timing dictionaries
    """
    words = []
    if 'result' in vosk_result and vosk_result['result']:
        for word_info in vosk_result['result']:
            words.append({
                "word": word_info.get('word', ''),
                "startTime": round(word_info.get('start', 0), 3),
                "endTime": round(word_info.get('end', 0), 3),
                "confidence": round(word_info.get('conf', 0.5), 3)
            })
    return words


def recognize_with_fallback(
    recognizer: sr.Recognizer, 
    audio: sr.AudioData, 
    metadata: Dict[str, Any],
    command_mode: bool = False
) -> Dict[str, Any]:
    """
    Try multiple recognition services with fallback.
    
    Args:
        recognizer: SpeechRecognition Recognizer instance
        audio: AudioData to recognize
        metadata: Audio metadata to include in response
        command_mode: If True, optimize for AAC commands
        
    Returns:
        Recognition result dictionary with standardized camelCase keys
    """
    errors = []
    start_time = time.time()

    # Try Google Speech Recognition first (usually more accurate for free-form speech)
    if not command_mode:
        try:
            log_debug("Trying Google Speech Recognition...")
            text = recognizer.recognize_google(audio, show_all=False)
            processing_time = int((time.time() - start_time) * 1000)
            log_debug(f"Google succeeded in {processing_time}ms: {text}")
            
            return build_success_response(
                text=text,
                service="google",
                confidence=0.85,  # Google doesn't provide confidence, estimate high
                metadata=metadata,
                processing_time=processing_time,
                command_mode=command_mode
            )
        except sr.UnknownValueError:
            log_debug("Google: Could not understand audio")
            errors.append({"service": "google", "error": "Could not understand audio"})
        except sr.RequestError as e:
            log_debug(f"Google RequestError: {e}")
            errors.append({"service": "google", "error": str(e)})
        except Exception as e:
            log_debug(f"Google unexpected error: {type(e).__name__}: {e}")
            errors.append({"service": "google", "error": str(e)})
    
    # Try Vosk (offline) - preferred for command mode
    try:
        log_debug("Trying Vosk offline recognition...")
        model = load_vosk_model(vosk_model_path)
        
        if model is None:
            raise RuntimeError("Vosk model not available")
        
        text, confidence, full_result = recognize_vosk(audio, model, command_mode)
        processing_time = int((time.time() - start_time) * 1000)

        if text:
            log_debug(f"Vosk succeeded in {processing_time}ms: {text}")
            
            # Extract word timing
            word_timing = extract_word_timing(full_result)
            
            return build_success_response(
                text=text,
                service="vosk",
                confidence=confidence,
                metadata=metadata,
                processing_time=processing_time,
                command_mode=command_mode,
                word_timing=word_timing
            )
        else:
            log_debug("Vosk: No text recognized")
            errors.append({"service": "vosk", "error": "Could not understand audio"})
            
    except Exception as e:
        log_debug(f"Vosk error: {type(e).__name__}: {e}")
        errors.append({"service": "vosk", "error": str(e)})
    
    # All services failed
    processing_time = int((time.time() - start_time) * 1000)
    log_debug(f"All services failed after {processing_time}ms")
    
    return build_error_response(
        error_code="ALL_SERVICES_FAILED",
        error_message="No recognition service could process the audio",
        metadata=metadata,
        processing_time=processing_time,
        error_details=errors
    )


# =============================================================================
# Response Builders
# =============================================================================

def build_success_response(
    text: str,
    service: str,
    confidence: float,
    metadata: Dict[str, Any],
    processing_time: int,
    command_mode: bool = False,
    word_timing: Optional[List[Dict]] = None
) -> Dict[str, Any]:
    """
    Build standardized success response with camelCase keys.
    
    Args:
        text: Recognized text
        service: Recognition service used
        confidence: Recognition confidence (0-1)
        metadata: Audio metadata
        processing_time: Processing time in milliseconds
        command_mode: Whether command mode was used
        word_timing: Optional word-level timing information
        
    Returns:
        Standardized response dictionary
    """
    # Classify command type
    command_type = classify_command(text) if command_mode else None
    
    response = {
        "success": True,
        "transcription": text,
        "confidence": round(confidence, 3),
        "service": service,
        "processingTimeMs": processing_time,
        
        # Audio metadata (camelCase)
        "audio": {
            "duration": metadata.get('duration'),
            "sampleRate": metadata.get('sampleRate') or metadata.get('sample_rate'),
            "format": metadata.get('format', 'WAV'),
            "channels": metadata.get('channels', 1)
        },
        
        # AAC-specific fields
        "aac": {
            "commandMode": command_mode,
            "commandType": command_type,
            "isCommand": command_type in COMMAND_CATEGORIES if command_type else False
        }
    }
    
    # Add word timing if available
    if word_timing:
        response["wordTiming"] = word_timing
    
    # Add suggested actions for commands
    if command_type and command_type != "freeform":
        response["aac"]["suggestedActions"] = get_suggested_actions(text, command_type)
    
    return response


def build_error_response(
    error_code: str,
    error_message: str,
    metadata: Dict[str, Any],
    processing_time: int,
    error_details: Optional[List[Dict]] = None,
    warnings: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Build standardized error response with camelCase keys.
    
    Args:
        error_code: Error code string
        error_message: Human-readable error message
        metadata: Audio metadata
        processing_time: Processing time in milliseconds
        error_details: Optional list of service-specific errors
        warnings: Optional list of warning messages
        
    Returns:
        Standardized error response dictionary
    """
    response = {
        "success": False,
        "transcription": None,
        "processingTimeMs": processing_time,
        
        "error": {
            "code": error_code,
            "message": error_message
        },
        
        "audio": {
            "duration": metadata.get('duration'),
            "sampleRate": metadata.get('sampleRate') or metadata.get('sample_rate'),
            "format": metadata.get('format', 'WAV'),
            "channels": metadata.get('channels', 1)
        }
    }
    
    if error_details:
        response["error"]["details"] = error_details
    
    if warnings:
        response["warnings"] = warnings
    
    return response


def get_suggested_actions(text: str, command_type: str) -> List[str]:
    """
    Get suggested follow-up actions based on recognized command.
    
    Args:
        text: Recognized text
        command_type: Classified command type
        
    Returns:
        List of suggested action strings
    """
    suggestions = {
        "navigation": ["confirm_navigation", "show_menu", "go_back"],
        "selection": ["confirm_selection", "cancel", "show_options"],
        "communication": ["send_message", "repeat", "edit"],
        "media": ["adjust_volume", "skip", "stop"]
    }
    return suggestions.get(command_type, [])


# =============================================================================
# Main Entry Point
# =============================================================================

def process_audio(
    audio_bytes: bytes,
    command_mode: bool = False,
    skip_preprocessing: bool = False
) -> Dict[str, Any]:
    """
    Process audio bytes and return recognition result.
    
    This is the main entry point for audio processing, suitable for
    direct calls or integration with web servers.
    
    Args:
        audio_bytes: Raw audio bytes
        command_mode: If True, optimize for AAC command recognition
        skip_preprocessing: If True, skip audio preprocessing
        
    Returns:
        Recognition result dictionary
    """
    start_time = time.time()
    
    recognizer = sr.Recognizer()
    
    # Configure recognizer for AAC context (optimized for quick responses)
    recognizer.energy_threshold = 300
    recognizer.dynamic_energy_threshold = True
    recognizer.pause_threshold = 0.4  # Shorter for faster response
    recognizer.phrase_threshold = 0.2
    recognizer.non_speaking_duration = 0.2
    recognizer.operation_timeout = 10  # Reduced timeout for AAC responsiveness

    if len(audio_bytes) == 0:
        return build_error_response(
            error_code="NO_AUDIO_DATA",
            error_message="No audio data received",
            metadata={},
            processing_time=0
        )

    # Detect format
    audio_format = detect_audio_format(audio_bytes)
    log_debug(f"Detected audio format: {audio_format}")

    # Get audio metadata
    metadata = {}
    audio_file = io.BytesIO(audio_bytes)

    if audio_format == 'WAV':
        metadata = get_wav_metadata(audio_file)
        audio_file.seek(0)
        log_debug(f"Audio metadata: {metadata}")
    
    try:
        # Load audio for recognition
        with sr.AudioFile(audio_file) as source:
            # Quick ambient noise calibration
            if metadata.get('duration', 0) > 0.3:
                adjust_ambient_noise(recognizer, source, duration=0.2)

            # Record audio
            audio = recognizer.record(source)

            # Update metadata if not set
            if 'sampleRate' not in metadata:
                metadata['sampleRate'] = source.SAMPLE_RATE
            if 'sampleWidth' not in metadata:
                metadata['sampleWidth'] = source.SAMPLE_WIDTH
            if 'duration' not in metadata:
                metadata['duration'] = round(
                    len(audio.frame_data) / (source.SAMPLE_RATE * source.SAMPLE_WIDTH), 
                    3
                )
            
            # Validate audio quality
            validation = validate_audio_quality(
                audio, 
                metadata['sampleRate'], 
                metadata['duration']
            )

            if not validation['valid']:
                processing_time = int((time.time() - start_time) * 1000)
                return build_error_response(
                    error_code="AUDIO_QUALITY_ISSUES",
                    error_message="; ".join(validation['issues']),
                    metadata=metadata,
                    processing_time=processing_time,
                    warnings=validation['warnings']
                )
            
            # Preprocess audio (unless skipped)
            if not skip_preprocessing:
                audio = preprocess_audio(recognizer, audio)

            # Recognize with fallback
            result = recognize_with_fallback(recognizer, audio, metadata, command_mode)

            # Add validation warnings if any
            if validation['warnings']:
                result['warnings'] = validation['warnings']
            
            return result
            
    except Exception as e:
        log_debug(f"Exception in process_audio: {type(e).__name__}: {e}")
        processing_time = int((time.time() - start_time) * 1000)
        return build_error_response(
            error_code="PROCESSING_ERROR",
            error_message=str(e),
            metadata=metadata,
            processing_time=processing_time
        )


def main():
    """Main entry point when run from command line."""
    
    # Check for command-line flags
    command_mode = '--command-mode' in sys.argv or os.environ.get('AAC_COMMAND_MODE') == 'true'
    skip_preprocessing = '--skip-preprocessing' in sys.argv
    
    # Preload Vosk model if available (reduces first-request latency)
    if os.environ.get('PRELOAD_VOSK', 'true').lower() == 'true':
        log_debug("Preloading Vosk model...")
        warm_up_models()

    try:
        # Read audio from stdin
        audio_bytes = sys.stdin.buffer.read()
        
        # Process audio
        result = process_audio(
            audio_bytes, 
            command_mode=command_mode,
            skip_preprocessing=skip_preprocessing
        )
        
        # Output result
        print(json.dumps(result))
        sys.exit(0 if result['success'] else 1)
        
    except Exception as e:
        log_debug(f"Exception in main: {type(e).__name__}: {e}")
        result = {
            "success": False,
            "transcription": None,
            "error": {
                "code": "GENERAL_ERROR",
                "message": str(e)
            }
        }
        print(json.dumps(result))
        sys.exit(3)


if __name__ == "__main__":
    main()