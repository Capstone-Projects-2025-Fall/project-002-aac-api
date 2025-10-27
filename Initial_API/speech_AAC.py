"""
File: speech_AAC.py
Description: This module handles speech recognition from audio input. It reads audio data from standard input,
processes it, and outputs the recognized text. It also includes functionality to convert audio formats using pydub.

Author: Giovanni Muniz
Last Updated: 10/27/2025
Update: attempted to add audio conversion functionality using pydub.
"""


import speech_recognition as sr
import sys
import io
from pydub import AudioSegment

# Initialize recognizer
recognizer = sr.Recognizer()

# Main processing block
def transcribe_audio():
    try:
        # Read full audio file from stdin (bytes)
        audio_bytes = sys.stdin.buffer.read()

        # Load audio from bytes (handles WAV, FLAC, AIFF, etc.)
        with sr.AudioFile(io.BytesIO(audio_bytes)) as source:
            audio = recognizer.record(source)
        # Recognize speech using Google
        text = recognizer.recognize_google(audio)
        print(text)
    except sr.UnknownValueError:
        print("Could not understand audio")
        sys.exit(1)
    except sr.RequestError as e:
        print(f"Error: {e}")
        sys.exit(2)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(3)
    
def convert_audio(input_bytes, target_format="wav"):
    audio = AudioSegment.from_file(io.BytesIO(input_bytes))
    output_io = io.BytesIO()
    audio.export(output_io, format=target_format)
    output_io.seek(0)
    return output_io.getvalue()

if __name__ == "__main__":
    transcribe_audio()
