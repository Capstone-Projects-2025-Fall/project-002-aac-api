import speech_recognition as sr
import sys
import io
import json
import wave
import os
import time

recognizer = sr.Recognizer()

# Get API selection from environment variable or command line argument
# Format: comma-separated list like "google,openai,azure" or "google" for single API
api_list = os.getenv('SPEECH_APIS', 'google').split(',')
api_list = [api.strip().lower() for api in api_list]

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
    
    # Try multiple APIs and collect results with confidence scores
    api_results = []
    
    for api_name in api_list:
        try:
            start_time = time.time()
            api_result = {
                "apiProvider": api_name,
                "transcription": None,
                "confidenceScore": None,
                "processingTimeMs": None,
                "error": None
            }
            
            if api_name == "google":
                # Google Speech Recognition (free tier)
                text = recognizer.recognize_google(audio, show_all=False)
                # Google doesn't provide confidence scores in free tier, estimate based on length
                # For synthesized voices, we'll use a lower default confidence
                confidence = 0.7 if text and len(text) > 0 else 0.0
                api_result["transcription"] = text
                api_result["confidenceScore"] = confidence
                
            elif api_name == "google_cloud":
                # Google Cloud Speech-to-Text (requires API key)
                # Note: This requires GOOGLE_APPLICATION_CREDENTIALS environment variable
                try:
                    text = recognizer.recognize_google_cloud(audio, credentials_json=None)
                    # Google Cloud provides confidence in show_all=True, but for simplicity using default
                    confidence = 0.85
                    api_result["transcription"] = text
                    api_result["confidenceScore"] = confidence
                except Exception as e:
                    api_result["error"] = {"code": "API_ERROR", "message": str(e)}
                    
            elif api_name == "sphinx":
                # CMU Sphinx (offline, works with synthesized voices but less accurate)
                text = recognizer.recognize_sphinx(audio)
                # Sphinx doesn't provide confidence, estimate lower for synthesized voices
                confidence = 0.6 if text and len(text) > 0 else 0.0
                api_result["transcription"] = text
                api_result["confidenceScore"] = confidence
                
            else:
                # Unknown API, skip
                continue
                
            processing_time = int((time.time() - start_time) * 1000)
            api_result["processingTimeMs"] = processing_time
            api_results.append(api_result)
            
        except sr.UnknownValueError:
            api_result["error"] = {"code": "UNKNOWN_VALUE", "message": "Could not understand audio"}
            api_result["confidenceScore"] = 0.0
            api_result["processingTimeMs"] = int((time.time() - start_time) * 1000)
            api_results.append(api_result)
        except sr.RequestError as e:
            api_result["error"] = {"code": "REQUEST_ERROR", "message": str(e)}
            api_result["processingTimeMs"] = int((time.time() - start_time) * 1000)
            api_results.append(api_result)
        except Exception as e:
            api_result["error"] = {"code": "PROCESSING_ERROR", "message": str(e)}
            api_result["processingTimeMs"] = int((time.time() - start_time) * 1000)
            api_results.append(api_result)
    
    # Select best result based on highest confidence score
    successful_results = [r for r in api_results if r.get("transcription") and r.get("confidenceScore", 0) > 0]
    
    if successful_results:
        # Get result with highest confidence
        best_result = max(successful_results, key=lambda x: x.get("confidenceScore", 0))
        final_transcription = best_result["transcription"]
        final_confidence = best_result["confidenceScore"]
        selected_api = best_result["apiProvider"]
    else:
        # No successful results
        final_transcription = None
        final_confidence = 0.0
        selected_api = None
    
    # Calculate aggregated confidence (average of all successful results)
    if successful_results:
        aggregated_confidence = sum(r.get("confidenceScore", 0) for r in successful_results) / len(successful_results)
    else:
        aggregated_confidence = 0.0
    
    # Output JSON with metadata and confidence scores
    result = {
        "success": final_transcription is not None,
        "transcription": final_transcription,
        "confidenceScore": final_confidence,
        "aggregatedConfidenceScore": round(aggregated_confidence, 3),
        "selectedApi": selected_api,
        "apiResults": api_results,
        "duration": round(duration, 2) if duration else 0,
        "sample_rate": sample_rate,
        "sample_width": sample_width,
        "format": audio_format
    }
    print(json.dumps(result))

except Exception as e:
    # Fallback error handling
    result = {
        "success": False,
        "transcription": None,
        "confidenceScore": 0.0,
        "aggregatedConfidenceScore": 0.0,
        "selectedApi": None,
        "apiResults": [],
        "error_code": "PROCESSING_ERROR",
        "error_message": str(e)
    }
    print(json.dumps(result))
    sys.exit(3)
