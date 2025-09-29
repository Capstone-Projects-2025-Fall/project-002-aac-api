# pip install SpeechRecognition pyaudio

import speech_recognition as sr

recognizer = sr.Recognizer()

DURATION = 5 # 5 seconds

with sr.Microphone() as source:
    print(f"Recording for {DURATION} seconds..")
    audio = recognizer.record(source, duration=DURATION)

    print("Recording finished!")

    try:
        text = recognizer.recognize_google(audio)
        print(f"You said : {text}")
    except sr.UnknownValueError:
        print("Could not understand audio")
    except sr.RequestError as e:
        print(f"Error: {e}")
