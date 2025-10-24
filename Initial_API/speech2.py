import speech_recognition as sr
import sys

recognizer = sr.Recognizer()

try:
    # Read audio data from stdin (sent by Node.js)
    audio_data = sys.stdin.buffer.read()
    
    # Create AudioData object from the buffer
    # Note: You may need to specify the sample rate and width
    # This assumes 16kHz, 16-bit audio (adjust as needed)
    audio = sr.AudioData(audio_data, sample_rate=16000, sample_width=2)
    
    # Attempt to transcribe
    text = recognizer.recognize_google(audio)
    print(text)  # Output only the transcription
    
except sr.UnknownValueError:
    print("Could not understand audio")
    sys.exit(1)
except sr.RequestError as e:
    print(f"Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)