import speech_recognition as sr
import sys
import io
import json
import wave
import numpy as np
from scipy.io import signal
import audioop

def preprocess_audio(recognizer, audio):
    """Preprocess audio data for better recognition in AAC context."""

    # Noise reduction using ambient noise adjustment
    try:
        # Convert to numpy array for processing
        raw_date = np.frombuffer(audio.frame_data, np.int16)
        # Apply filer to remove low frequency noise
        nyquist = audio.sample_rate / 2
        low_cutoff = 100 # Remove frequencies below 100Hz
        normal_cutoff = low_cutoff / nyquist
        b, a = signal.butter(5, normal_cutoff, btype='high', analog=False)
        filtered_data = signal.filtfilt(b, a, raw_date)

        # Convert back to bytes
        filtered_bytes = filtered_data.astype(np.int16).tobytes()
    except:
        pass # If preprocessing fails, use original audio
    
    return audio

def adjust_ambient_noise(recognizer, source, duration=0.5):
    """Adjust for ambient noise in the audio source."""
    try:
        recognizer.adjust_for_ambient_noise(source, duration=min(duration, 1))
    except:
        # If calibration failes, then use the default energy threshold
        recognizer.energy_threshold = 300 

# For AAC devices, reliability is key, so we want to add a fallback service
def recognize_with_fallback(recognizer, audio, metadata):
    """Try multiple recognition services with fallback."""

    error = []

    # First, try Google Speech Recognition
    try:
        text = recognizer.recognize_google(audio, show_all=False)
        return {
            "Success": True,
            "Transcription": text,
            "Service": "Google",
            **metadata
        }
    except sr.UnknownValueError:
        error.append({"Service": "Google", "Error": "Could not understand audio"})
    except sr.RequestError as e:
        error.append({"Service": "Google", "Error": str(e)})
    
    # If Google fails, try Sphinx (offline)
    try:
        text = recognizer.recognize_sphinx(audio)
        return {
            "Success": True,
            "Transcription": text,
            "Service": "Sphinx-offline",
            "note": "Used offline recognition as fallback",
            **metadata
        }
    except Exception as e:
        error.append({"Service": "Sphinx", "Error": str(e)})
    
    # If there are API keys, we could add more services here

    # If all else fails, return errors
    return {
        "Success": False,
        "Transcription": None,
        "Error_code": "ALL_SERVICES_FAILED",
        "Error_details": error,
        **metadata
    }

def validate_audio_quality(audio, sample_rate, duration):
    """Validate audio quality for AAC context."""
    
    issues = []
    warnings = []

    # Check the duration
    if duration < 0.1:
        issues.append("Audio too short for reliable recognition")
    elif duration < 0.5:
        warnings.append("Audio may be too short for best results")
    elif duration > 60:
        warnings.append("Long audio may lead to timeouts or errors")
    
    # Check if audio has any content (not silent)
    try:
        rms = audioop.rms(audio.frame_data, audio.sample_width)  # width=2 for 16-bit audio
        if rms < 100: # Very quiet audio
            issues.append("Audio appears to be silent or very quiet")
        elif rms < 500:
            warnings.append("Audio is quite quiet, recognition may be affected")
    except:
        issues.append("Could not determine audio volume")
    
    # Check sample rate
    if sample_rate < 16000:
        warnings.append("Low sample rate may affect recognition quality")
    
    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings
    }

def detect_audio_format(audio_bytes):
    """Detect audio format from byte stream."""
    if audio_bytes.startswith(b'RIFF'):
        return 'WAV'
    elif audio_bytes[0:3] == b'ID3' or audio_bytes[0:2] == b'\xff\xfb':
        return 'MP3'
    elif audio_bytes[0:4] == b'fLaC':
        return 'FLAC'
    else:
        return 'UNKNOWN'

def get_wav_metadata(audio_file):
    """Extract metadata from WAV audio file."""
    try:
        with wave.open(audio_file, 'rb') as wf:
            sample_rate = wf.getframerate()
            sample_width = wf.getsampwidth()
            channels = wf.getnchannels()
            frames = wf.getnframes()
            duration = frames / float(sample_rate)
            channels = wf.getnchannels()
            metadata = {
                'duration': round(duration,2),
                'sample_rate': sample_rate,
                'sample_width': sample_width,
                'channels': channels,
                'format': 'WAV'
            }
    except:
        pass
    return metadata

def main():
    recognizer = sr.Recognizer()

    # Configure recognizer for AAC context
    recognizer.energy_threshold = 300
    recognizer.dynamic_energy_threshold = True
    recognizer.pause_threshold = 0.5
    recognizer.phrase_threshold = 0.3

    try:
        # Read audio from stdin
        audio_bytes = sys.stdin.buffer.read()

        if len(audio_bytes) == 0:
            raise ValueError("No audio data received")

        # detect format
        audio_format = detect_audio_format(audio_bytes)

        # Get audio metadata
        metadata = {}
        audio_file = io.BytesIO(audio_bytes)

        if audio_format == 'WAV':
            metadata = get_wav_metadata(audio_file)
            audio_file.seek(0)  # Reset to beginning
        
        # Load audio for recognition
        with sr.AudioFile(audio_file) as source:
            # Calibarate for ambient noise
            if metadata.get('duration', 0) > 0:
                adjust_ambient_noise(recognizer, source, duration=min(metadata['duration'], 0.5))

            # Record audio
            audio = recognizer.record(source)

            # Update metadata if not set
            if 'sample_rate' not in metadata:
                metadata['sample_rate'] = source.SAMPLE_RATE
            if 'sample_width' not in metadata:
                metadata['sample_width'] = source.SAMPLE_WIDTH
            if 'duration' not in metadata:
                metadata['duration'] = round(len(audio.frame_data) / (source.SAMPLE_RATE * source.SAMPLE_WIDTH), 2)
            
            # Validate audio quality
            validation = validate_audio_quality(audio, metadata['sample_rate'], metadata['duration'])

            if not validation['valid']:
                result = {
                    "Success": False,
                    "Transcription": None,
                    "Error_code": "AUDIO_QUALITY_ISSUES",
                    "Issues": validation['issues'],
                    "Warnings": validation['warnings'],
                    **metadata
                }
                print(json.dumps(result))
                sys.exit(1)
            
            # Preprocess audio
            audio = preprocess_audio(recognizer, audio)

            # Recognize with fallback
            result = recognize_with_fallback(recognizer, audio, metadata)

            # Add validation warnings if any
            if validation['warnings']:
                result['Warnings'] = validation['warnings']
            
            print(json.dumps(result))
            sys.exit(0 if result['Success'] else 1)
    
    except Exception as e:
        result = {
            "Success": False,
            "Transcription": None,
            "Error_code": "GENERAL_ERROR",
            "Error_message": str(e)
        }
        print(json.dumps(result))
        sys.exit(3)

if __name__ == "__main__":
    main()