/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { voiceTwinService } from '@verified-prof/web/services/voice-twin.service';

interface TranscriptEntry {
  speaker: 'user' | 'twin';
  text: string;
  timestamp: Date;
}

interface VoiceTwinState {
  isConnected: boolean;
  isConnecting: boolean;
  isPreparing: boolean;
  transcript: TranscriptEntry[];
  error: string | null;
  timeRemaining: number;
  voiceName: string | null;
}

export const useVoiceTwin = (slug: string) => {
  const [state, setState] = useState<VoiceTwinState>({
    isConnected: false,
    isConnecting: false,
    isPreparing: false,
    transcript: [],
    error: null,
    timeRemaining: 15,
    voiceName: null,
  });

  const sessionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const startTimer = useCallback(() => {
    let seconds = 15 * 60;
    timerRef.current = setInterval(() => {
      seconds--;
      setState((prev) => ({
        ...prev,
        timeRemaining: Math.floor(seconds / 60),
      }));

      if (seconds <= 0) {
        endSession();
      }
    }, 1000);
  }, []);

  const startSession = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      const { token, voiceName } = await voiceTwinService.getToken(slug);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          sampleRate: { ideal: 48000 },
          sampleSize: { ideal: 16 },
          channelCount: { ideal: 1 },
        },
      });
      streamRef.current = stream;

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: 'v1alpha' },
      });

      const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

      const inputAudioContext = new AudioContext({
        latencyHint: 'interactive',
      });
      const outputAudioContext = new AudioContext({
        latencyHint: isFirefox ? 'playback' : 'interactive',
      });
      inputAudioContextRef.current = inputAudioContext;
      outputAudioContextRef.current = outputAudioContext;

      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      const analyser = outputAudioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      outputNode.connect(analyser);
      audioAnalyserRef.current = analyser;

      let nextStartTime = 0;
      const audioSources = new Set<AudioBufferSourceNode>();
      const firefoxBuffer = isFirefox ? 0.2 : 0;

      const decodeAudioData = async (
        data: Uint8Array,
      ): Promise<AudioBuffer> => {
        const sourceSampleRate = 24000;
        const targetSampleRate = outputAudioContext.sampleRate;
        const dataInt16 = new Int16Array(data.buffer);
        const sourceSamples = dataInt16.length;
        const targetSamples = Math.floor(
          (sourceSamples * targetSampleRate) / sourceSampleRate,
        );

        const buffer = outputAudioContext.createBuffer(
          1,
          targetSamples,
          targetSampleRate,
        );
        const channelData = new Float32Array(targetSamples);

        for (let i = 0; i < targetSamples; i++) {
          const sourcePosition = (i * sourceSampleRate) / targetSampleRate;
          const sourceIndex = Math.floor(sourcePosition);
          const frac = sourcePosition - sourceIndex;

          const sample1 = dataInt16[sourceIndex] / 32768.0;
          const sample2 =
            sourceIndex + 1 < sourceSamples
              ? dataInt16[sourceIndex + 1] / 32768.0
              : sample1;

          channelData[i] = sample1 + frac * (sample2 - sample1);
        }

        buffer.copyToChannel(channelData, 0);
        return buffer;
      };

      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onmessage: async (message: any) => {
            if (message.serverContent?.interrupted) {
              for (const source of audioSources.values()) {
                try {
                  source.stop();
                } catch {
                  // Ignore errors when stopping already stopped sources
                }
                audioSources.delete(source);
              }
              nextStartTime = 0;
              return;
            }

            if (message.serverContent?.inputTranscription?.text) {
              setState((prev) => ({
                ...prev,
                isPreparing: false,
                transcript: [
                  ...prev.transcript,
                  {
                    speaker: 'user',
                    text: message.serverContent.inputTranscription.text,
                    timestamp: new Date(),
                  },
                ],
              }));
            }

            if (message.serverContent?.outputTranscription?.text) {
              setState((prev) => ({
                ...prev,
                isPreparing: false,
                transcript: [
                  ...prev.transcript,
                  {
                    speaker: 'twin',
                    text: message.serverContent.outputTranscription.text,
                    timestamp: new Date(),
                  },
                ],
              }));
            }

            const audio =
              message.serverContent?.modelTurn?.parts[0]?.inlineData;
            if (audio) {
              const currentTime = outputAudioContext.currentTime;

              if (nextStartTime < currentTime + firefoxBuffer) {
                nextStartTime = currentTime + firefoxBuffer;
              }

              const audioData = Uint8Array.from(atob(audio.data), (c) =>
                c.charCodeAt(0),
              );
              const audioBuffer = await decodeAudioData(audioData);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;

              if (isFirefox) {
                source.playbackRate.value = 1.0;
              }

              source.connect(outputNode);

              source.onended = () => {
                audioSources.delete(source);
              };

              source.start(nextStartTime);
              nextStartTime = nextStartTime + audioBuffer.duration;
              audioSources.add(source);
            }
          },
          onerror: (error: any) => {
            setState((prev) => ({
              ...prev,
              error: error.message || 'Connection error',
            }));
          },
        },
      });

      sessionRef.current = session;

      const sourceNode = inputAudioContext.createMediaStreamSource(stream);

      // Use smaller buffer size for lower latency (2048 = ~43ms at 48kHz)
      const bufferSize = 2048;
      const scriptProcessorNode = inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );
      scriptProcessorRef.current = scriptProcessorNode;

      scriptProcessorNode.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const inputSampleRate = inputAudioContext.sampleRate;
        const targetSampleRate = 16000;

        // Downsample from input sample rate to 16kHz
        const ratio = inputSampleRate / targetSampleRate;
        const targetLength = Math.floor(inputData.length / ratio);
        const pcmData = new Int16Array(targetLength);

        for (let i = 0; i < targetLength; i++) {
          const sourceIndex = Math.floor(i * ratio);
          const s = Math.max(-1, Math.min(1, inputData[sourceIndex]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(pcmData.buffer)),
        );

        session.sendRealtimeInput({
          media: {
            data: base64Audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      };

      sourceNode.connect(scriptProcessorNode);

      session.sendRealtimeInput({
        text: "Please greet the recruiter warmly and introduce yourself as their AI twin. Let them know you're ready to answer any questions about the verified developer profile, projects, and technical expertise. Keep it brief and welcoming.",
      });

      setState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        isPreparing: true,
        voiceName,
      }));
      startTimer();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error:
          error instanceof Error ? error.message : 'Failed to start session',
      }));
    }
  }, [slug, startTimer]);

  const endSession = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (
      inputAudioContextRef.current &&
      inputAudioContextRef.current.state !== 'closed'
    ) {
      await inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    if (
      outputAudioContextRef.current &&
      outputAudioContextRef.current.state !== 'closed'
    ) {
      await outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    if (sessionRef.current) {
      // await sessionRef.current.close();
      sessionRef.current = null;
    }

    if (state.transcript.length > 0) {
      await voiceTwinService.saveConversation(slug, {
        transcript: state.transcript,
        duration: (15 - state.timeRemaining) * 60,
      });
    }

    audioAnalyserRef.current = null;

    setState((prev) => ({
      ...prev,
      isConnected: false,
      isPreparing: false,
      timeRemaining: 15,
    }));
  }, [slug, state.transcript, state.timeRemaining]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (
        inputAudioContextRef.current &&
        inputAudioContextRef.current.state !== 'closed'
      ) {
        inputAudioContextRef.current.close();
      }
      if (
        outputAudioContextRef.current &&
        outputAudioContextRef.current.state !== 'closed'
      ) {
        outputAudioContextRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    audioAnalyser: audioAnalyserRef.current,
    startSession,
    endSession,
    slug,
  };
};
