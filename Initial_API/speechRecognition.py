"""
AAC Board Speech Recognition Module
===================================
Optimized speech recognition for AAC (Augmentative and Alternative Communication) devices.
This module provides audio preprocessing, format detection, quality validation, and
integration with multiple speech recognition services (Vosk offline and Google online)
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
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError as FuturesTimeoutError

# Vosk imports
vosk = None
VOSK_MODEL = None  # Store loaded model globally
vosk_model_path = os.environ.get('VOSK_MODEL_PATH', 'model/vosk-model-small-en-us-0.15')

# =============================================================================
# Cached State for Latency Reduction
# =============================================================================

_cached_energy_threshold: Optional[float] = None
_energy_threshold_lock = False  # Simple flag to prevent race conditions

# =============================================================================
# AAC Command Configuration
# =============================================================================

AAC_COMMANDS = [
    # Navigation
    "yes", "no", "help", "back", "next", "previous", "home", "menu", "exit", "stop",
    # Selection
    "select", "choose", "pick", "open", "close", "cancel", "confirm", "delete", "this",
    # Communication
    "hello", "goodbye", "thank you", "please", "sorry", "wait", "more", "done",
    # Actions
    "play", "pause", "repeat", "louder", "quieter", "up", "down", "left", "right", "top",
    # Game Actions
    "center", "middle right", "middle left", "bottom right", "bottom center", "bottom left", "top left", "top center", "top right"
]

COMMAND_CATEGORIES = {
    "navigation": ["back", "next", "previous", "home", "menu", "exit", "up", "down", "left", "right"],
    "selection": ["select", "choose", "pick", "open", "close", "cancel", "confirm", "delete", "yes", "no"],
    "communication": ["hello", "goodbye", "thank you", "please", "sorry", "wait", "more", "done", "help"],
    "media": ["play", "pause", "stop", "repeat", "louder", "quieter"]
}

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
    """Load Vosk model for offline recognition."""
    global vosk, VOSK_MODEL

    if VOSK_MODEL is not None:
        return VOSK_MODEL

    try:
        import vosk as vosk_module
        vosk = vosk_module
        vosk.SetLogLevel(-1)
        
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
        "voskAvailable": vosk is not None,
        "cachedEnergyThreshold": _cached_energy_threshold
    }


def warm_up_models() -> Dict[str, bool]:
    """Warm up recognition models to reduce first-request latency."""
    results = {"vosk": False}
    
    model = load_vosk_model(vosk_model_path)
    if model is not None:
        try:
            sample_rate = 16000
            silent_audio = bytes(sample_rate * 2)
            rec = vosk.KaldiRecognizer(model, sample_rate)
            rec.AcceptWaveform(silent_audio)
            rec.FinalResult()
            results["vosk"] = True
            log_debug("Vosk model warmed up successfully")
        except Exception as e:
            log_debug(f"Vosk warm-up failed: {e}")
    
    return results


def reset_cached_state():
    """Reset cached state (useful for testing or environment changes)."""
    global _cached_energy_threshold
    _cached_energy_threshold = None


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
    """Detect audio format from byte stream."""
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
    """Extract metadata from WAV audio file."""
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


def preprocess_audio(
    recognizer: sr.Recognizer, 
    audio: sr.AudioData, 
    apply_filter: bool = True,
    use_simple_filter: bool = False
) -> sr.AudioData:
    """
    Preprocess audio data for better recognition in AAC context.
    
    Args:
        recognizer: SpeechRecognition Recognizer instance
        audio: AudioData to preprocess
        apply_filter: If False, skip filtering entirely (fastest)
        use_simple_filter: If True, use faster single-pole filter instead of Butterworth
    """
    if not apply_filter:
        return audio
    
    try:
        raw_data = np.frombuffer(audio.frame_data, np.int16).astype(np.float64)
        
        if len(raw_data) == 0:
            return audio
        
        if use_simple_filter:
            # Simple single-pole high-pass filter (much faster)
            # y[n] = alpha * (y[n-1] + x[n] - x[n-1])
            alpha = 0.98  # Cutoff ~80Hz at 16kHz sample rate
            filtered_data = np.zeros_like(raw_data)
            filtered_data[0] = raw_data[0]
            for i in range(1, len(raw_data)):
                filtered_data[i] = alpha * (filtered_data[i-1] + raw_data[i] - raw_data[i-1])
        else:
            # Full Butterworth filter (more accurate but slower)
            nyquist = audio.sample_rate / 2
            low_cutoff = 80
            normal_cutoff = low_cutoff / nyquist
            
            if normal_cutoff >= 1.0 or normal_cutoff <= 0:
                log_debug("Warning: Invalid cutoff frequency, skipping filter")
                return audio
            
            b, a = signal.butter(4, normal_cutoff, btype='high', analog=False)
            filtered_data = signal.filtfilt(b, a, raw_data)

        # Normalize audio
        max_val = np.max(np.abs(filtered_data))
        if max_val > 0:
            filtered_data = filtered_data * (32767 * 0.9 / max_val)

        filtered_data = np.clip(filtered_data, -32768, 32767)

        processed_audio = sr.AudioData(
            filtered_data.astype(np.int16).tobytes(),
            audio.sample_rate,
            audio.sample_width
        )
        return processed_audio
        
    except Exception as e:
        log_debug(f"Preprocessing failed: {e}, using original audio")
        return audio


def adjust_ambient_noise(
    recognizer: sr.Recognizer, 
    source: sr.AudioSource, 
    duration: float = 0.3,
    use_cached: bool = True
) -> None:
    """
    Adjust for ambient noise in the audio source.
    Uses cached threshold when available for faster response.
    """
    global _cached_energy_threshold, _energy_threshold_lock
    
    # Use cached threshold if available and requested
    if use_cached and _cached_energy_threshold is not None:
        recognizer.energy_threshold = _cached_energy_threshold
        log_debug(f"Using cached energy threshold: {_cached_energy_threshold}")
        return
    
    try:
        recognizer.adjust_for_ambient_noise(source, duration=min(duration, 0.5))
        
        # Cache the threshold for future use
        if not _energy_threshold_lock:
            _energy_threshold_lock = True
            _cached_energy_threshold = recognizer.energy_threshold
            _energy_threshold_lock = False
            log_debug(f"Cached energy threshold: {_cached_energy_threshold}")
            
    except Exception:
        recognizer.energy_threshold = 350


def validate_audio_quality(
    audio: sr.AudioData, 
    sample_rate: int, 
    duration: float,
    strict: bool = True
) -> Dict[str, Any]:
    """
    Validate audio quality for AAC context.
    
    Args:
        audio: AudioData to validate
        sample_rate: Audio sample rate
        duration: Audio duration in seconds
        strict: If False, only check critical issues (faster)
    """
    issues = []
    warnings = []

    # Critical checks (always performed)
    if duration < 0.1:
        issues.append("Audio too short (< 0.1s)")
    
    # Check if audio has content
    try:
        rms = audioop.rms(audio.frame_data, audio.sample_width)
        if rms < 50:
            issues.append("Audio appears silent or nearly silent")
        elif strict and rms < 200:
            warnings.append("Audio volume is low")
    except Exception:
        if strict:
            warnings.append("Could not analyze audio volume")
    
    # Non-critical checks (skip in fast mode)
    if strict:
        if duration < 0.3:
            warnings.append("Audio may be too short for reliable recognition")
        elif duration > 30:
            warnings.append("Long audio may increase processing time")
        
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

def recognize_vosk(
    audio_data: sr.AudioData, 
    model: Any, 
    command_mode: bool = False
) -> Tuple[str, float, Dict]:
    """Recognize speech using Vosk offline model."""
    if vosk is None or model is None:
        raise RuntimeError("Vosk model is not loaded")

    rec = vosk.KaldiRecognizer(model, audio_data.sample_rate)
    rec.SetMaxAlternatives(3)
    rec.SetWords(True)
    
    if command_mode:
        grammar = json.dumps(AAC_COMMANDS)
        try:
            rec = vosk.KaldiRecognizer(model, audio_data.sample_rate, grammar)
            rec.SetWords(True)
        except Exception as e:
            log_debug(f"Failed to set command grammar: {e}")

    audio_bytes = audio_data.frame_data
    audio_length = len(audio_bytes)
    
    # Adaptive chunk size based on audio length
    # For short audio (< 1 second at 16kHz, 16-bit), process all at once
    if audio_length < audio_data.sample_rate * 2:
        rec.AcceptWaveform(audio_bytes)
    else:
        # Use larger chunks for longer audio
        chunk_size = 8000  # Increased from 4000
        for i in range(0, audio_length, chunk_size):
            chunk = audio_bytes[i:i+chunk_size]
            rec.AcceptWaveform(chunk)

    result = json.loads(rec.FinalResult())
    text = result.get('text', '').strip()

    confidence = 0.5
    if 'alternatives' in result and result['alternatives']:
        confidence = result['alternatives'][0].get('confidence', 0.5)
    elif 'result' in result and result['result']:
        word_confidences = [word.get('conf', 0.5) for word in result['result']]
        if word_confidences:
            confidence = sum(word_confidences) / len(word_confidences)
    
    return text, confidence, result


def try_google_recognition(recognizer: sr.Recognizer, audio: sr.AudioData) -> Dict[str, Any]:
    """Attempt Google Speech Recognition (for parallel execution)."""
    try:
        start_time = time.time()
        text = recognizer.recognize_google(audio, show_all=False)
        processing_time = int((time.time() - start_time) * 1000)
        return {
            "success": True,
            "text": text,
            "service": "google",
            "confidence": 0.85,
            "processingTime": processing_time
        }
    except sr.UnknownValueError:
        return {"success": False, "service": "google", "error": "Could not understand audio"}
    except sr.RequestError as e:
        return {"success": False, "service": "google", "error": str(e)}
    except Exception as e:
        return {"success": False, "service": "google", "error": str(e)}


def try_vosk_recognition(audio: sr.AudioData, command_mode: bool = False) -> Dict[str, Any]:
    """Attempt Vosk recognition (for parallel execution)."""
    try:
        start_time = time.time()
        model = load_vosk_model(vosk_model_path)
        
        if model is None:
            return {"success": False, "service": "vosk", "error": "Vosk model not available"}
        
        text, confidence, full_result = recognize_vosk(audio, model, command_mode)
        processing_time = int((time.time() - start_time) * 1000)
        
        if text:
            word_timing = extract_word_timing(full_result)
            return {
                "success": True,
                "text": text,
                "service": "vosk",
                "confidence": confidence,
                "processingTime": processing_time,
                "wordTiming": word_timing,
                "fullResult": full_result
            }
        else:
            return {"success": False, "service": "vosk", "error": "Could not understand audio"}
            
    except Exception as e:
        return {"success": False, "service": "vosk", "error": str(e)}


def classify_command(text: str) -> Optional[str]:
    """Classify recognized text into AAC command category."""
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
    """Extract word-level timing information from Vosk result."""
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
    command_mode: bool = False,
    use_parallel: bool = True,
    parallel_timeout: float = 5.0
) -> Dict[str, Any]:
    """
    Try multiple recognition services with fallback.
    
    Args:
        recognizer: SpeechRecognition Recognizer instance
        audio: AudioData to recognize
        metadata: Audio metadata to include in response
        command_mode: If True, optimize for AAC commands
        use_parallel: If True, try services in parallel (faster for non-command mode)
        parallel_timeout: Timeout for parallel recognition in seconds
    """
    errors = []
    start_time = time.time()

    # OPTIMIZATION: In command mode, try Vosk FIRST (local + grammar-constrained)
    if command_mode:
        log_debug("Command mode: Trying Vosk first (local + grammar-constrained)...")
        vosk_result = try_vosk_recognition(audio, command_mode=True)
        
        if vosk_result["success"]:
            processing_time = int((time.time() - start_time) * 1000)
            log_debug(f"Vosk succeeded in {processing_time}ms: {vosk_result['text']}")
            
            return build_success_response(
                text=vosk_result["text"],
                service="vosk",
                confidence=vosk_result["confidence"],
                metadata=metadata,
                processing_time=processing_time,
                command_mode=True,
                word_timing=vosk_result.get("wordTiming")
            )
        else:
            errors.append({"service": "vosk", "error": vosk_result.get("error", "Unknown error")})
            
        # Fallback to Google for command mode
        log_debug("Vosk failed in command mode, falling back to Google...")
        google_result = try_google_recognition(recognizer, audio)
        
        if google_result["success"]:
            processing_time = int((time.time() - start_time) * 1000)
            return build_success_response(
                text=google_result["text"],
                service="google",
                confidence=google_result["confidence"],
                metadata=metadata,
                processing_time=processing_time,
                command_mode=True
            )
        else:
            errors.append({"service": "google", "error": google_result.get("error", "Unknown error")})
    
    # Non-command mode: use parallel recognition for speed
    elif use_parallel:
        log_debug("Non-command mode: Trying parallel recognition...")
        
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = {
                executor.submit(try_google_recognition, recognizer, audio): "google",
                executor.submit(try_vosk_recognition, audio, False): "vosk"
            }
            
            try:
                for future in as_completed(futures, timeout=parallel_timeout):
                    service = futures[future]
                    try:
                        result = future.result()
                        if result["success"]:
                            processing_time = int((time.time() - start_time) * 1000)
                            log_debug(f"{service} succeeded first in {processing_time}ms: {result['text']}")
                            
                            # Cancel remaining futures
                            for f in futures:
                                f.cancel()
                            
                            return build_success_response(
                                text=result["text"],
                                service=service,
                                confidence=result["confidence"],
                                metadata=metadata,
                                processing_time=processing_time,
                                command_mode=False,
                                word_timing=result.get("wordTiming")
                            )
                        else:
                            errors.append({"service": service, "error": result.get("error", "Unknown error")})
                    except Exception as e:
                        errors.append({"service": service, "error": str(e)})
                        
            except FuturesTimeoutError:
                log_debug(f"Parallel recognition timed out after {parallel_timeout}s")
                errors.append({"service": "parallel", "error": f"Timeout after {parallel_timeout}s"})
    
    # Sequential fallback (non-command mode without parallel)
    else:
        # Try Google first
        log_debug("Trying Google Speech Recognition...")
        google_result = try_google_recognition(recognizer, audio)
        
        if google_result["success"]:
            processing_time = int((time.time() - start_time) * 1000)
            return build_success_response(
                text=google_result["text"],
                service="google",
                confidence=google_result["confidence"],
                metadata=metadata,
                processing_time=processing_time,
                command_mode=False
            )
        else:
            errors.append({"service": "google", "error": google_result.get("error", "Unknown error")})
        
        # Try Vosk
        log_debug("Trying Vosk offline recognition...")
        vosk_result = try_vosk_recognition(audio, command_mode=False)
        
        if vosk_result["success"]:
            processing_time = int((time.time() - start_time) * 1000)
            return build_success_response(
                text=vosk_result["text"],
                service="vosk",
                confidence=vosk_result["confidence"],
                metadata=metadata,
                processing_time=processing_time,
                command_mode=False,
                word_timing=vosk_result.get("wordTiming")
            )
        else:
            errors.append({"service": "vosk", "error": vosk_result.get("error", "Unknown error")})
    
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
    """Build standardized success response with camelCase keys."""
    command_type = classify_command(text) if command_mode else None
    
    response = {
        "success": True,
        "transcription": text,
        "confidence": round(confidence, 3),
        "service": service,
        "processingTimeMs": processing_time,
        
        "audio": {
            "duration": metadata.get('duration'),
            "sampleRate": metadata.get('sampleRate') or metadata.get('sample_rate'),
            "format": metadata.get('format', 'WAV'),
            "channels": metadata.get('channels', 1)
        },
        
        "aac": {
            "commandMode": command_mode,
            "commandType": command_type,
            "isCommand": command_type in COMMAND_CATEGORIES if command_type else False
        }
    }
    
    if word_timing:
        response["wordTiming"] = word_timing
    
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
    """Build standardized error response with camelCase keys."""
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
    """Get suggested follow-up actions based on recognized command."""
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
    skip_preprocessing: bool = False,
    skip_validation: bool = False,
    trusted_format: Optional[str] = None,
    use_parallel: bool = True,
    use_simple_filter: bool = False,
    use_cached_threshold: bool = True
) -> Dict[str, Any]:
    """
    Process audio bytes and return recognition result.
    
    Args:
        audio_bytes: Raw audio bytes
        command_mode: If True, optimize for AAC command recognition
        skip_preprocessing: If True, skip audio preprocessing entirely
        skip_validation: If True, skip audio quality validation (for trusted sources)
        trusted_format: If provided, skip format detection
        use_parallel: If True, use parallel recognition in non-command mode
        use_simple_filter: If True, use faster single-pole filter
        use_cached_threshold: If True, use cached energy threshold
    """
    start_time = time.time()
    
    recognizer = sr.Recognizer()
    
    # Configure recognizer for AAC context
    recognizer.energy_threshold = 300
    recognizer.dynamic_energy_threshold = True
    recognizer.pause_threshold = 0.4
    recognizer.phrase_threshold = 0.2
    recognizer.non_speaking_duration = 0.2
    recognizer.operation_timeout = 10

    if len(audio_bytes) == 0:
        return build_error_response(
            error_code="NO_AUDIO_DATA",
            error_message="No audio data received",
            metadata={},
            processing_time=0
        )

    # Detect or use trusted format
    if trusted_format:
        audio_format = trusted_format
        log_debug(f"Using trusted audio format: {audio_format}")
    else:
        audio_format = detect_audio_format(audio_bytes)
        log_debug(f"Detected audio format: {audio_format}")

    # Get audio metadata
    metadata = {'format': audio_format}
    audio_file = io.BytesIO(audio_bytes)

    if audio_format == 'WAV':
        metadata = get_wav_metadata(audio_file)
        audio_file.seek(0)
        log_debug(f"Audio metadata: {metadata}")
    
    try:
        with sr.AudioFile(audio_file) as source:
            # Ambient noise calibration (uses cache when available)
            if metadata.get('duration', 0) > 0.3:
                adjust_ambient_noise(
                    recognizer, 
                    source, 
                    duration=0.2,
                    use_cached=use_cached_threshold
                )

            audio = recognizer.record(source)

            # Update metadata
            if 'sampleRate' not in metadata:
                metadata['sampleRate'] = source.SAMPLE_RATE
            if 'sampleWidth' not in metadata:
                metadata['sampleWidth'] = source.SAMPLE_WIDTH
            if 'duration' not in metadata:
                metadata['duration'] = round(
                    len(audio.frame_data) / (source.SAMPLE_RATE * source.SAMPLE_WIDTH), 
                    3
                )
            
            # Validate audio quality (skip for trusted sources)
            if not skip_validation:
                # Use non-strict validation in command mode for speed
                validation = validate_audio_quality(
                    audio, 
                    metadata['sampleRate'], 
                    metadata['duration'],
                    strict=not command_mode
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
                
                warnings = validation['warnings']
            else:
                warnings = []
                log_debug("Skipping audio validation (trusted source)")
            
            # Preprocess audio
            # Skip preprocessing in command mode for speed, or when explicitly requested
            should_preprocess = not skip_preprocessing and not command_mode
            
            if should_preprocess:
                audio = preprocess_audio(
                    recognizer, 
                    audio, 
                    apply_filter=True,
                    use_simple_filter=use_simple_filter
                )
            elif command_mode:
                log_debug("Skipping preprocessing in command mode for speed")

            # Recognize with fallback
            result = recognize_with_fallback(
                recognizer, 
                audio, 
                metadata, 
                command_mode,
                use_parallel=use_parallel and not command_mode
            )

            # Add validation warnings if any
            if warnings:
                result['warnings'] = result.get('warnings', []) + warnings
            
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
    
    # Parse command-line flags
    command_mode = '--command-mode' in sys.argv or os.environ.get('AAC_COMMAND_MODE') == 'true'
    skip_preprocessing = '--skip-preprocessing' in sys.argv
    skip_validation = '--skip-validation' in sys.argv
    no_parallel = '--no-parallel' in sys.argv
    simple_filter = '--simple-filter' in sys.argv
    no_cache = '--no-cache' in sys.argv
    
    # Preload Vosk model
    if os.environ.get('PRELOAD_VOSK', 'true').lower() == 'true':
        log_debug("Preloading Vosk model...")
        warm_up_models()

    try:
        audio_bytes = sys.stdin.buffer.read()
        
        result = process_audio(
            audio_bytes, 
            command_mode=command_mode,
            skip_preprocessing=skip_preprocessing,
            skip_validation=skip_validation,
            use_parallel=not no_parallel,
            use_simple_filter=simple_filter,
            use_cached_threshold=not no_cache
        )
        
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