// audio-processor.js
class VoiceMaskProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pitchShift = 0.8;
    this.distortion = 0.3;
    this.reverb = 0.1;
    this.buffer = new Float32Array(4096);
    this.bufferIndex = 0;

    this.port.onmessage = (event) => {
      if (event.data.type === 'config') {
        this.pitchShift = event.data.pitchShift || 0.8;
        this.distortion = event.data.distortion || 0.3;
        this.reverb = event.data.reverb || 0.1;
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length > 0 && output.length > 0) {
      const inputChannel = input[0];
      const outputChannel = output[0];

      for (let i = 0; i < inputChannel.length; i++) {
        // Pitch shifting
        const sourceIndex = Math.floor(i * this.pitchShift);
        let sample = sourceIndex < inputChannel.length ? inputChannel[sourceIndex] : 0;

        // Distortion
        sample = Math.tanh(sample * (1 + this.distortion)) * (1 - this.distortion * 0.3);

        // Simple reverb
        if (this.bufferIndex < this.buffer.length) {
          sample += this.buffer[this.bufferIndex] * this.reverb;
          this.buffer[this.bufferIndex] = sample * 0.5;
          this.bufferIndex = (this.bufferIndex + 1) % this.buffer.length;
        }

        outputChannel[i] = sample;
      }
    }

    return true;
  }
}

registerProcessor('voice-mask-processor', VoiceMaskProcessor);