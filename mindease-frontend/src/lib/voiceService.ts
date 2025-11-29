class VoiceService {
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private biquadFilter: BiquadFilterNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private isVoiceMasked: boolean = true;
  private isInitialized: boolean = false;

  async initializeAudio(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing audio:', error);
      return false;
    }
  }

  async getUserAudio(): Promise<MediaStream> {
    try {
      if (!this.isInitialized) {
        await this.initializeAudio();
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
        video: false
      });

      console.log('Got user media, applying voice masking:', this.isVoiceMasked);

      if (this.isVoiceMasked && this.audioContext) {
        return this.applyVoiceEffects(this.localStream);
      }

      return this.localStream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw new Error('Could not access microphone. Please check permissions.');
    }
  }

  private applyVoiceEffects(stream: MediaStream): MediaStream {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    // Create audio nodes
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.destinationNode = this.audioContext.createMediaStreamDestination();
    this.gainNode = this.audioContext.createGain();
    this.biquadFilter = this.audioContext.createBiquadFilter();

    // Configure voice masking effects
    if (this.biquadFilter) {
      // Lower pitch by reducing frequency
      this.biquadFilter.type = 'lowpass';
      this.biquadFilter.frequency.setValueAtTime(800, this.audioContext.currentTime);
      this.biquadFilter.Q.setValueAtTime(1, this.audioContext.currentTime);
    }

    if (this.gainNode) {
      // Slight volume reduction
      this.gainNode.gain.setValueAtTime(0.8, this.audioContext.currentTime);
    }

    // Connect nodes: source -> filter -> gain -> destination
    if (this.sourceNode && this.biquadFilter && this.gainNode && this.destinationNode) {
      this.sourceNode.connect(this.biquadFilter);
      this.biquadFilter.connect(this.gainNode);
      this.gainNode.connect(this.destinationNode);
    }

    console.log('Voice effects applied');
    return this.destinationNode.stream;
  }

  async toggleVoiceMask(enabled: boolean): Promise<MediaStream | null> {
    this.isVoiceMasked = enabled;
    
    if (this.localStream) {
      this.stopAudio();
      
      try {
        return await this.getUserAudio();
      } catch (error) {
        console.error('Error getting new audio stream:', error);
        return null;
      }
    }
    
    return null;
  }

  getVoiceMaskEnabled(): boolean {
    return this.isVoiceMasked;
  }

  stopAudio() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    // Disconnect audio nodes
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.biquadFilter) {
      this.biquadFilter.disconnect();
      this.biquadFilter = null;
    }

    if (this.destinationNode) {
      this.destinationNode.disconnect();
      this.destinationNode = null;
    }
  }

  getCurrentStream(): MediaStream | null {
    return this.localStream;
  }

  destroy() {
    this.stopAudio();
    
    if (this.audioContext) {
      this.audioContext.close().then(() => {
        console.log('Audio context closed');
      }).catch(error => {
        console.error('Error closing audio context:', error);
      });
      this.audioContext = null;
    }
    
    this.isInitialized = false;
  }
}

export const voiceService = new VoiceService();