#!/usr/bin/env python3
"""
Test script for AAC board speech recognition
"""

import subprocess
import json
import os
import sys
import wave
import struct
import math
import tempfile
from pathlib import Path

class SpeechRecognitionTester:
    def __init__(self, script_path="/speechRecognition.py"):
        self.script_path = script_path
        self.test_results = []
    
    def create_test_wav(self, filename, duration=1.0, frequency=440, sample_rate=16000, silent=False):
        """Create a test WAV file with a tone or silence"""
        num_samples = int(duration * sample_rate)
        
        with wave.open(filename, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            
            if silent:
                # Create silence
                frames = struct.pack('h' * num_samples, *[0] * num_samples)
            else:
                # Create a sine wave tone
                frames = []
                for i in range(num_samples):
                    value = int(32767.0 * math.sin(2.0 * math.pi * frequency * i / sample_rate))
                    frames.append(struct.pack('h', value))
                frames = b''.join(frames)
            
            wav_file.writeframes(frames)
        
        return filename
    
    def test_with_audio_file(self, audio_path, test_name=""):
        """Test the speech recognition with an audio file"""
        print(f"\n{'='*50}")
        print(f"Testing: {test_name or audio_path}")
        print('='*50)
        
        try:
            # Read the audio file
            with open(audio_path, 'rb') as audio_file:
                audio_data = audio_file.read()
            
            # Run the speech recognition script
            process = subprocess.Popen(
                [sys.executable, self.script_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            stdout, stderr = process.communicate(input=audio_data)
            
            # Parse the result
            result = json.loads(stdout.decode())
            
            # Display results
            print(f"✓ Success: {result.get('Success', False)}")
            if result.get('Success'):
                print(f"✓ Transcription: '{result.get('Transcription', '')}'")
                print(f"✓ Service used: {result.get('Service', 'Unknown')}")
                print(f"✓ Duration: {result.get('duration', 0)}s")
                print(f"✓ Sample Rate: {result.get('sample_rate', 0)}Hz")
            else:
                print(f"✗ Error: {result.get('Error_code', 'Unknown')}")
                if result.get('Issues'):
                    print(f"  Issues: {', '.join(result['Issues'])}")
                if result.get('Warnings'):
                    print(f"  Warnings: {', '.join(result['Warnings'])}")
            
            # Store result
            self.test_results.append({
                'test_name': test_name,
                'success': result.get('Success', False),
                'result': result
            })
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"✗ Failed to parse JSON output: {e}")
            print(f"  Raw output: {stdout.decode() if stdout else 'None'}")
            print(f"  Stderr: {stderr.decode() if stderr else 'None'}")
            return None
        except Exception as e:
            print(f"✗ Test failed: {str(e)}")
            return None
    
    def run_all_tests(self):
        """Run all test scenarios"""
        print("\n" + "="*60)
        print("AAC SPEECH RECOGNITION TEST SUITE")
        print("="*60)
        
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            
            # Test 1: Silent audio (should fail with appropriate error)
            print("\n[TEST 1] Silent Audio Detection")
            silent_file = tmpdir / "silent.wav"
            self.create_test_wav(silent_file, duration=1.0, silent=True)
            self.test_with_audio_file(silent_file, "Silent Audio (Should Fail)")
            
            # Test 2: Very short audio
            print("\n[TEST 2] Very Short Audio")
            short_file = tmpdir / "short.wav"
            self.create_test_wav(short_file, duration=0.05, frequency=440)
            self.test_with_audio_file(short_file, "Very Short Audio (0.05s)")
            
            # Test 3: Low sample rate audio
            print("\n[TEST 3] Low Sample Rate")
            low_rate_file = tmpdir / "low_rate.wav"
            self.create_test_wav(low_rate_file, duration=1.0, sample_rate=8000)
            self.test_with_audio_file(low_rate_file, "Low Sample Rate (8kHz)")
            
            # Test 4: Normal tone (will likely fail transcription but should process)
            print("\n[TEST 4] Normal Tone")
            tone_file = tmpdir / "tone.wav"
            self.create_test_wav(tone_file, duration=2.0, frequency=440, sample_rate=16000)
            self.test_with_audio_file(tone_file, "440Hz Tone (2s)")
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        total = len(self.test_results)
        successful = sum(1 for t in self.test_results if t['success'])
        
        print(f"Total tests: {total}")
        print(f"Successful: {successful}")
        print(f"Failed: {total - successful}")
        print(f"Success rate: {(successful/total*100) if total > 0 else 0:.1f}%")

def main():
    """Main test function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test AAC Speech Recognition')
    parser.add_argument('--script', default='speechRecognition.py', 
                       help='Path to the speech recognition script')
    parser.add_argument('--audio', help='Test with a specific audio file')
    parser.add_argument('--record', action='store_true', 
                       help='Record audio from microphone for testing')
    
    args = parser.parse_args()
    
    tester = SpeechRecognitionTester(args.script)
    
    if args.audio:
        # Test with specific audio file
        tester.test_with_audio_file(args.audio, "User Provided Audio")
    elif args.record:
        # Record and test
        print("Recording audio for 3 seconds...")
        record_and_test(tester)
    else:
        # Run all automated tests
        tester.run_all_tests()

def record_and_test(tester):
    """Record audio from microphone and test"""
    import pyaudio
    import wave
    import tempfile
    import os
    
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 16000
    RECORD_SECONDS = 3
    
    p = pyaudio.PyAudio()
    
    print("Recording... Speak now!")
    
    stream = p.open(format=FORMAT,
                   channels=CHANNELS,
                   rate=RATE,
                   input=True,
                   frames_per_buffer=CHUNK)
    
    frames = []
    
    for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
        data = stream.read(CHUNK)
        frames.append(data)
    
    print("Recording finished!")
    
    stream.stop_stream()
    stream.close()
    p.terminate()
    
    # Save recording - Fixed version
    tmp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    tmp_filename = tmp_file.name
    tmp_file.close()  # Close the file handle immediately
    
    # Now write to the file
    wf = wave.open(tmp_filename, 'wb')
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()  # Make sure to close the wave file
    
    try:
        # Test the recording
        tester.test_with_audio_file(tmp_filename, "Microphone Recording")
    finally:
        # Clean up - now it should work
        try:
            os.unlink(tmp_filename)
        except PermissionError:
            # If still can't delete, it's okay - temp files get cleaned up eventually
            print(f"Note: Could not delete temp file {tmp_filename}, will be cleaned up later")

if __name__ == "__main__":
    main()