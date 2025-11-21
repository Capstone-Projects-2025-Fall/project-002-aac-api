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