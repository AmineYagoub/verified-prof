class AudioProcessorWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 16000;
    this.inputSampleRate = sampleRate;
    this.resampleRatio = this.inputSampleRate / this.targetSampleRate;
    this.buffer = [];
  }

  process(inputs, outputs) {
    const input = inputs[0];

    if (input && input[0]) {
      const inputData = input[0];

      for (let i = 0; i < inputData.length; i++) {
        this.buffer.push(inputData[i]);
      }

      while (this.buffer.length >= this.resampleRatio) {
        const samples = [];
        const numSamples = Math.floor(this.buffer.length / this.resampleRatio);

        for (let i = 0; i < numSamples; i++) {
          const index = Math.floor(i * this.resampleRatio);
          samples.push(this.buffer[index]);
        }

        this.buffer = this.buffer.slice(numSamples * this.resampleRatio);

        const pcmData = new Int16Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, samples[i] * 32768));
        }

        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(pcmData.buffer)),
        );

        this.port.postMessage({ audio: base64Audio });
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessorWorklet);
