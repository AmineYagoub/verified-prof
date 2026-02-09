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
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: 'v1alpha' },
      });

      const inputAudioContext = new AudioContext({ sampleRate: 16000 });
      const outputAudioContext = new AudioContext({ sampleRate: 24000 });
      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      const analyser = outputAudioContext.createAnalyser();
      analyser.fftSize = 2048;
      outputNode.connect(analyser);
      audioAnalyserRef.current = analyser;

      let nextStartTime = 0;
      const audioSources = new Set<AudioBufferSourceNode>();

      const decodeAudioData = async (
        data: Uint8Array,
      ): Promise<AudioBuffer> => {
        const buffer = outputAudioContext.createBuffer(
          1,
          data.length / 2,
          24000,
        );
        const dataInt16 = new Int16Array(data.buffer);
        const dataFloat32 = new Float32Array(dataInt16.length);
        for (let i = 0; i < dataInt16.length; i++) {
          dataFloat32[i] = dataInt16[i] / 32768.0;
        }
        buffer.copyToChannel(dataFloat32, 0);
        return buffer;
      };

      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onmessage: async (message: any) => {
            if (message.serverContent?.interrupted) {
              for (const source of audioSources.values()) {
                source.stop();
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
              nextStartTime = Math.max(
                nextStartTime,
                outputAudioContext.currentTime,
              );

              const audioData = Uint8Array.from(atob(audio.data), (c) =>
                c.charCodeAt(0),
              );
              const audioBuffer = await decodeAudioData(audioData);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.addEventListener('ended', () => {
                audioSources.delete(source);
              });

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
      const scriptProcessorNode = inputAudioContext.createScriptProcessor(
        4096,
        1,
        1,
      );

      scriptProcessorNode.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = inputData[i] * 32768;
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
      scriptProcessorNode.connect(inputAudioContext.destination);

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

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
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
