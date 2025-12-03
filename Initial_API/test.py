#!/usr/bin/env python3
"""
Test script for AAC Board Speech Recognition API

Tests the improved speechRecognition.py module with:
- Standardized camelCase response format
- Command mode recognition
- Word timing extraction
- Audio quality validation
- Multiple recognition service fallback

Author: Original by Gio, updated for AAC improvements
"""

import subprocess
import json
import os
import sys
import wave
import struct
import math
import tempfile
import time
from pathlib import Path
from typing import Optional, Dict, Any, List

# ANSI color codes for pretty output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def color(text: str, color_code: str) -> str:
    """Apply color to text if terminal supports it."""
    if sys.stdout.isatty():
        return f"{color_code}{text}{Colors.END}"
    return text


class SpeechRecognitionTester:
    """Test harness for AAC speech recognition module."""
    
    def __init__(self, script_path: str = "../speechRecognition.py"):
        self.script_path = script_path
        self.test_results: List[Dict[str, Any]] = []
    
    def create_test_wav(
        self, 
        filename: str, 
        duration: float = 1.0, 
        frequency: int = 440, 
        sample_rate: int = 16000, 
        silent: bool = False,
        add_noise: bool = False
    ) -> str:
        """
        Create a test WAV file with various audio characteristics.
        
        Args:
            filename: Output file path
            duration: Audio duration in seconds
            frequency: Tone frequency in Hz
            sample_rate: Sample rate in Hz
            silent: If True, create silent audio
            add_noise: If True, add background noise
            
        Returns:
            Path to created file
        """
        num_samples = int(duration * sample_rate)
        
        with wave.open(str(filename), 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            
            if silent:
                # Create silence
                frames = struct.pack('h' * num_samples, *[0] * num_samples)
            else:
                # Create a sine wave tone
                samples = []
                for i in range(num_samples):
                    value = int(32767.0 * 0.8 * math.sin(2.0 * math.pi * frequency * i / sample_rate))
                    
                    # Add noise if requested
                    if add_noise:
                        import random
                        noise = random.randint(-1000, 1000)
                        value = max(-32767, min(32767, value + noise))
                    
                    samples.append(value)
                
                frames = struct.pack('h' * num_samples, *samples)
            
            wav_file.writeframes(frames)
        
        return str(filename)
    
    def create_speech_like_wav(
        self,
        filename: str,
        duration: float = 1.0,
        sample_rate: int = 16000
    ) -> str:
        """
        Create a WAV file with speech-like characteristics (multiple frequencies).
        This won't be recognized as speech, but tests audio processing.
        
        Args:
            filename: Output file path
            duration: Audio duration in seconds
            sample_rate: Sample rate in Hz
            
        Returns:
            Path to created file
        """
        num_samples = int(duration * sample_rate)
        
        # Speech-like frequencies (formants)
        frequencies = [300, 700, 1200, 2500]
        amplitudes = [0.4, 0.3, 0.2, 0.1]
        
        with wave.open(str(filename), 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            
            samples = []
            for i in range(num_samples):
                value = 0
                for freq, amp in zip(frequencies, amplitudes):
                    value += amp * math.sin(2.0 * math.pi * freq * i / sample_rate)
                
                # Apply envelope (attack/decay)
                envelope = min(1.0, i / (sample_rate * 0.05))  # 50ms attack
                envelope *= min(1.0, (num_samples - i) / (sample_rate * 0.05))  # 50ms decay
                
                value = int(32767.0 * value * envelope)
                samples.append(max(-32767, min(32767, value)))
            
            frames = struct.pack('h' * num_samples, *samples)
            wav_file.writeframes(frames)
        
        return str(filename)
    
    def test_with_audio_file(
        self, 
        audio_path: str, 
        test_name: str = "",
        command_mode: bool = False,
        expected_success: Optional[bool] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Test the speech recognition with an audio file.
        
        Args:
            audio_path: Path to audio file
            test_name: Name for this test
            command_mode: Whether to use AAC command mode
            expected_success: Expected result (for pass/fail reporting)
            
        Returns:
            Recognition result dictionary or None on error
        """
        print(f"\n{'─'*60}")
        print(color(f"Testing: {test_name or audio_path}", Colors.BOLD))
        if command_mode:
            print(color("  [Command Mode Enabled]", Colors.CYAN))
        print('─'*60)
        
        try:
            # Read the audio file
            with open(audio_path, 'rb') as audio_file:
                audio_data = audio_file.read()
            
            # Build command
            cmd = [sys.executable, self.script_path]
            if command_mode:
                cmd.append('--command-mode')
            
            # Run the speech recognition script
            start_time = time.time()
            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            stdout, stderr = process.communicate(input=audio_data, timeout=30)
            elapsed_time = (time.time() - start_time) * 1000
            
            # Show stderr (debug info)
            if stderr:
                debug_lines = stderr.decode().strip().split('\n')
                for line in debug_lines[-5:]:  # Show last 5 debug lines
                    print(color(f"  [debug] {line}", Colors.YELLOW))
            
            # Parse the result (now using camelCase)
            result = json.loads(stdout.decode())
            
            # Display results with new camelCase format
            success = result.get('success', False)
            
            if success:
                print(color("✓ Success: True", Colors.GREEN))
                print(f"  Transcription: '{result.get('transcription', '')}'")
                print(f"  Confidence: {result.get('confidence', 0):.2%}")
                print(f"  Service: {result.get('service', 'Unknown')}")
                print(f"  Processing Time: {result.get('processingTimeMs', 0)}ms")
                
                # Audio metadata
                audio_info = result.get('audio', {})
                print(f"  Audio: {audio_info.get('duration', 0)}s @ {audio_info.get('sampleRate', 0)}Hz")
                
                # AAC-specific info
                aac_info = result.get('aac', {})
                if aac_info:
                    print(color(f"  AAC Command Mode: {aac_info.get('commandMode', False)}", Colors.CYAN))
                    if aac_info.get('commandType'):
                        print(color(f"  Command Type: {aac_info.get('commandType')}", Colors.CYAN))
                    if aac_info.get('suggestedActions'):
                        print(color(f"  Suggested Actions: {aac_info.get('suggestedActions')}", Colors.CYAN))
                
                # Word timing
                word_timing = result.get('wordTiming', [])
                if word_timing:
                    print(color("  Word Timing:", Colors.BLUE))
                    for word_info in word_timing[:5]:  # Show first 5 words
                        print(f"    '{word_info['word']}': {word_info['startTime']:.2f}s - {word_info['endTime']:.2f}s ({word_info['confidence']:.0%})")
                    if len(word_timing) > 5:
                        print(f"    ... and {len(word_timing) - 5} more words")
            else:
                print(color("✗ Success: False", Colors.RED))
                error_info = result.get('error', {})
                print(f"  Error Code: {error_info.get('code', 'Unknown')}")
                print(f"  Error Message: {error_info.get('message', 'No message')}")
                
                if error_info.get('details'):
                    print("  Service Errors:")
                    for detail in error_info['details']:
                        print(f"    - {detail.get('service', '?')}: {detail.get('error', '?')}")
            
            # Warnings
            warnings = result.get('warnings', [])
            if warnings:
                print(color("  Warnings:", Colors.YELLOW))
                for warning in warnings:
                    print(f"    ⚠ {warning}")
            
            # Check expected result
            test_passed = True
            if expected_success is not None:
                test_passed = (success == expected_success)
                if test_passed:
                    print(color(f"\n  ✓ Test PASSED (expected success={expected_success})", Colors.GREEN))
                else:
                    print(color(f"\n  ✗ Test FAILED (expected success={expected_success}, got {success})", Colors.RED))
            
            # Timing info
            print(f"\n  Total test time: {elapsed_time:.0f}ms")
            
            # Store result
            self.test_results.append({
                'test_name': test_name,
                'success': success,
                'test_passed': test_passed,
                'expected_success': expected_success,
                'result': result,
                'elapsed_time': elapsed_time
            })
            
            return result
            
        except subprocess.TimeoutExpired:
            print(color("✗ Test timed out after 30 seconds", Colors.RED))
            self.test_results.append({
                'test_name': test_name,
                'success': False,
                'test_passed': False,
                'error': 'Timeout'
            })
            return None
        except json.JSONDecodeError as e:
            print(color(f"✗ Failed to parse JSON output: {e}", Colors.RED))
            print(f"  Raw output: {stdout.decode() if stdout else 'None'}")
            self.test_results.append({
                'test_name': test_name,
                'success': False,
                'test_passed': False,
                'error': f'JSON parse error: {e}'
            })
            return None
        except Exception as e:
            print(color(f"✗ Test failed: {str(e)}", Colors.RED))
            self.test_results.append({
                'test_name': test_name,
                'success': False,
                'test_passed': False,
                'error': str(e)
            })
            return None
    
    def test_response_format(self, result: Dict[str, Any], test_name: str) -> bool:
        """
        Validate response format follows new camelCase conventions.
        
        Args:
            result: Recognition result to validate
            test_name: Name for error reporting
            
        Returns:
            True if format is valid
        """
        print(f"\n  Validating response format...")
        
        errors = []
        
        # Required top-level fields
        required_fields = ['success', 'transcription']
        for field in required_fields:
            if field not in result:
                errors.append(f"Missing required field: {field}")
        
        # Check for old PascalCase fields (should not exist)
        old_fields = ['Success', 'Transcription', 'Error_code', 'Error_message']
        for field in old_fields:
            if field in result:
                errors.append(f"Found deprecated PascalCase field: {field}")
        
        # Validate audio object
        if 'audio' in result:
            audio = result['audio']
            expected_audio_fields = ['duration', 'sampleRate', 'format']
            for field in expected_audio_fields:
                if field not in audio:
                    errors.append(f"Missing audio.{field}")
        
        # Validate error object (if present)
        if not result.get('success') and 'error' in result:
            error = result['error']
            if 'code' not in error:
                errors.append("Error object missing 'code' field")
            if 'message' not in error:
                errors.append("Error object missing 'message' field")
        
        # Validate AAC object (if present)
        if 'aac' in result:
            aac = result['aac']
            if 'commandMode' not in aac:
                errors.append("AAC object missing 'commandMode' field")
        
        if errors:
            for error in errors:
                print(color(f"    ✗ {error}", Colors.RED))
            return False
        else:
            print(color("    ✓ Response format valid (camelCase)", Colors.GREEN))
            return True
    
    def run_all_tests(self):
        """Run comprehensive test suite."""
        print("\n" + "="*60)
        print(color("AAC SPEECH RECOGNITION TEST SUITE", Colors.BOLD))
        print("="*60)
        print(f"Script: {self.script_path}")
        print(f"Python: {sys.executable}")
        
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            
            # ─────────────────────────────────────────────────────────────
            # Test 1: Silent audio (should fail with audio quality error)
            # ─────────────────────────────────────────────────────────────
            print("\n" + color("[TEST 1] Silent Audio Detection", Colors.BOLD))
            silent_file = tmpdir / "silent.wav"
            self.create_test_wav(silent_file, duration=1.0, silent=True)
            result = self.test_with_audio_file(
                silent_file, 
                "Silent Audio (Should Fail)", 
                expected_success=False
            )
            if result:
                self.test_response_format(result, "Silent Audio")
            
            # ─────────────────────────────────────────────────────────────
            # Test 2: Very short audio (should fail or warn)
            # ─────────────────────────────────────────────────────────────
            print("\n" + color("[TEST 2] Very Short Audio", Colors.BOLD))
            short_file = tmpdir / "short.wav"
            self.create_test_wav(short_file, duration=0.05, frequency=440)
            result = self.test_with_audio_file(
                short_file, 
                "Very Short Audio (0.05s)",
                expected_success=False
            )
            if result:
                self.test_response_format(result, "Short Audio")
            
            # ─────────────────────────────────────────────────────────────
            # Test 3: Low sample rate audio (should process with warning)
            # ─────────────────────────────────────────────────────────────
            print("\n" + color("[TEST 3] Low Sample Rate", Colors.BOLD))
            low_rate_file = tmpdir / "low_rate.wav"
            self.create_test_wav(low_rate_file, duration=1.0, sample_rate=8000)
            result = self.test_with_audio_file(
                low_rate_file, 
                "Low Sample Rate (8kHz)"
            )
            if result:
                self.test_response_format(result, "Low Sample Rate")
                # Check for warning about sample rate
                warnings = result.get('warnings', [])
                has_rate_warning = any('sample rate' in w.lower() for w in warnings)
                if has_rate_warning:
                    print(color("    ✓ Low sample rate warning present", Colors.GREEN))
            
            # ─────────────────────────────────────────────────────────────
            # Test 4: Normal tone (tests processing pipeline)
            # ─────────────────────────────────────────────────────────────
            print("\n" + color("[TEST 4] Normal Tone Processing", Colors.BOLD))
            tone_file = tmpdir / "tone.wav"
            self.create_test_wav(tone_file, duration=2.0, frequency=440, sample_rate=16000)
            result = self.test_with_audio_file(
                tone_file, 
                "440Hz Tone (2s)"
            )
            if result:
                self.test_response_format(result, "Normal Tone")
            
            # ─────────────────────────────────────────────────────────────
            # Test 5: Speech-like audio (multiple frequencies)
            # ─────────────────────────────────────────────────────────────
            print("\n" + color("[TEST 5] Speech-like Audio", Colors.BOLD))
            speech_file = tmpdir / "speech_like.wav"
            self.create_speech_like_wav(speech_file, duration=1.5, sample_rate=16000)
            result = self.test_with_audio_file(
                speech_file, 
                "Speech-like Multi-frequency Audio"
            )
            if result:
                self.test_response_format(result, "Speech-like")
            
            # ─────────────────────────────────────────────────────────────
            # Test 6: Command mode (same audio, different mode)
            # ─────────────────────────────────────────────────────────────
            print("\n" + color("[TEST 6] Command Mode", Colors.BOLD))
            result = self.test_with_audio_file(
                tone_file,
                "Command Mode Recognition",
                command_mode=True
            )
            if result:
                self.test_response_format(result, "Command Mode")
                # Verify command mode flag in response
                aac = result.get('aac', {})
                if aac.get('commandMode') == True:
                    print(color("    ✓ Command mode flag correctly set", Colors.GREEN))
                else:
                    print(color("    ✗ Command mode flag not set correctly", Colors.RED))
            
            # ─────────────────────────────────────────────────────────────
            # Test 7: Noisy audio
            # ─────────────────────────────────────────────────────────────
            print("\n" + color("[TEST 7] Noisy Audio", Colors.BOLD))
            noisy_file = tmpdir / "noisy.wav"
            self.create_test_wav(noisy_file, duration=1.5, frequency=440, add_noise=True)
            result = self.test_with_audio_file(
                noisy_file,
                "Audio with Background Noise"
            )
            if result:
                self.test_response_format(result, "Noisy Audio")
            
            # ─────────────────────────────────────────────────────────────
            # Test 8: Processing time measurement
            # ─────────────────────────────────────────────────────────────
            print("\n" + color("[TEST 8] Processing Time", Colors.BOLD))
            timing_file = tmpdir / "timing.wav"
            self.create_test_wav(timing_file, duration=1.0, sample_rate=16000)
            result = self.test_with_audio_file(
                timing_file,
                "Processing Time Measurement"
            )
            if result:
                proc_time = result.get('processingTimeMs', 0)
                if proc_time > 0:
                    print(color(f"    ✓ Processing time reported: {proc_time}ms", Colors.GREEN))
                    if proc_time < 2000:
                        print(color("    ✓ Processing time under 2s (good for AAC)", Colors.GREEN))
                    else:
                        print(color("    ⚠ Processing time over 2s (may be slow for AAC)", Colors.YELLOW))
                else:
                    print(color("    ✗ Processing time not reported", Colors.RED))
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print comprehensive test summary."""
        print("\n" + "="*60)
        print(color("TEST SUMMARY", Colors.BOLD))
        print("="*60)
        
        total = len(self.test_results)
        successful = sum(1 for t in self.test_results if t.get('success', False))
        tests_passed = sum(1 for t in self.test_results if t.get('test_passed', False))
        
        # Calculate average processing time
        processing_times = [
            t['result'].get('processingTimeMs', 0) 
            for t in self.test_results 
            if t.get('result') and t['result'].get('processingTimeMs')
        ]
        avg_time = sum(processing_times) / len(processing_times) if processing_times else 0
        
        print(f"\nResults:")
        print(f"  Total tests: {total}")
        print(f"  Recognition successful: {successful}/{total}")
        print(f"  Tests passed (expected outcome): {tests_passed}/{total}")
        print(f"  Average processing time: {avg_time:.0f}ms")
        
        # Per-test breakdown
        print(f"\nPer-test results:")
        for i, test in enumerate(self.test_results, 1):
            status = "✓" if test.get('test_passed', False) else "✗"
            status_color = Colors.GREEN if test.get('test_passed', False) else Colors.RED
            name = test.get('test_name', f'Test {i}')
            elapsed = test.get('elapsed_time', 0)
            print(color(f"  {status} {name} ({elapsed:.0f}ms)", status_color))
        
        # Final verdict
        print("\n" + "─"*60)
        if tests_passed == total:
            print(color("All tests passed! ✓", Colors.GREEN + Colors.BOLD))
        else:
            print(color(f"{total - tests_passed} test(s) failed ✗", Colors.RED + Colors.BOLD))


def record_and_test(tester: SpeechRecognitionTester, duration: int = 3, command_mode: bool = False):
    """
    Record audio from microphone and test.
    
    Args:
        tester: SpeechRecognitionTester instance
        duration: Recording duration in seconds
        command_mode: Whether to use command mode
    """
    try:
        import pyaudio
    except ImportError:
        print(color("PyAudio not installed. Install with: pip install pyaudio", Colors.RED))
        return
    
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 16000
    
    p = pyaudio.PyAudio()
    
    print(f"\n{color('Recording...', Colors.CYAN)} Speak now! ({duration} seconds)")
    
    stream = p.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        frames_per_buffer=CHUNK
    )
    
    frames = []
    
    for i in range(0, int(RATE / CHUNK * duration)):
        data = stream.read(CHUNK)
        frames.append(data)
        # Progress indicator
        progress = int((i / (RATE / CHUNK * duration)) * 20)
        sys.stdout.write(f"\r  [{'█' * progress}{'░' * (20-progress)}]")
        sys.stdout.flush()
    
    print("\n" + color("Recording finished!", Colors.GREEN))
    
    stream.stop_stream()
    stream.close()
    p.terminate()
    
    # Save recording
    tmp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    tmp_filename = tmp_file.name
    tmp_file.close()
    
    wf = wave.open(tmp_filename, 'wb')
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()
    
    try:
        result = tester.test_with_audio_file(
            tmp_filename, 
            "Microphone Recording",
            command_mode=command_mode
        )
        if result:
            tester.test_response_format(result, "Microphone Recording")
    finally:
        try:
            os.unlink(tmp_filename)
        except PermissionError:
            print(f"Note: Could not delete temp file {tmp_filename}")


def main():
    """Main test function."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Test AAC Speech Recognition',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python test.py                           # Run all automated tests
  python test.py --audio my_audio.wav      # Test specific audio file
  python test.py --record                  # Record from microphone
  python test.py --record --command-mode   # Record with command mode
  python test.py --validate-format         # Only validate response format
        """
    )
    parser.add_argument(
        '--script', 
        default='../speechRecognition.py',
        help='Path to the speech recognition script'
    )
    parser.add_argument(
        '--audio', 
        help='Test with a specific audio file'
    )
    parser.add_argument(
        '--record', 
        action='store_true',
        help='Record audio from microphone for testing'
    )
    parser.add_argument(
        '--record-duration',
        type=int,
        default=3,
        help='Recording duration in seconds (default: 3)'
    )
    parser.add_argument(
        '--command-mode',
        action='store_true',
        help='Enable AAC command mode for recognition'
    )
    parser.add_argument(
        '--validate-format',
        action='store_true',
        help='Only validate response format (requires --audio)'
    )
    
    args = parser.parse_args()
    
    tester = SpeechRecognitionTester(args.script)
    
    if args.audio:
        result = tester.test_with_audio_file(
            args.audio, 
            "User Provided Audio",
            command_mode=args.command_mode
        )
        if result:
            tester.test_response_format(result, "User Audio")
        tester.print_summary()
    elif args.record:
        record_and_test(
            tester, 
            duration=args.record_duration,
            command_mode=args.command_mode
        )
    else:
        tester.run_all_tests()


if __name__ == "__main__":
    main()