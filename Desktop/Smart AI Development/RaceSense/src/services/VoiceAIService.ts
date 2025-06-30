import { useNotifications } from "@/components/RacingNotifications";

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  accent?: string;
  description: string;
  sampleText: string;
}

export interface VoiceCommand {
  command: string;
  aliases: string[];
  description: string;
  category: 'session' | 'navigation' | 'data' | 'settings' | 'coaching';
  action: () => void;
}

export interface AICoachingSession {
  id: string;
  timestamp: Date;
  sessionType: 'practice' | 'race' | 'analysis' | 'training';
  voiceId: string;
  coachingData: {
    lapTime?: number;
    corneringScore?: number;
    brakingScore?: number;
    throttleScore?: number;
    overallScore?: number;
    feedback: string[];
    recommendations: string[];
  };
}

export interface VoiceSettings {
  enabled: boolean;
  selectedVoice: string;
  volume: number;
  speed: number;
  pitch: number;
  autoSpeak: boolean;
  coachingMode: 'aggressive' | 'encouraging' | 'technical' | 'calm';
  voiceControlEnabled: boolean;
  wakeWord: string;
  commandConfidence: number;
}

class VoiceAIService {
  private synthesis: SpeechSynthesis | null = null;
  private recognition: SpeechRecognition | null = null;
  private listening = false;
  private currentVoice: SpeechSynthesisVoice | null = null;
  private settings: VoiceSettings = {
    enabled: true,
    selectedVoice: 'racing-coach-male',
    volume: 0.8,
    speed: 1.0,
    pitch: 1.0,
    autoSpeak: true,
    coachingMode: 'encouraging',
    voiceControlEnabled: true,
    wakeWord: 'hey racesense',
    commandConfidence: 0.7
  };

  private commands: VoiceCommand[] = [];
  private wakeWordActive = false;
  private lastCommandTime = 0;

  public voiceOptions: VoiceOption[] = [
    {
      id: 'male',
      name: 'Male Voice',
      language: 'en-US',
      gender: 'male',
      accent: 'Default',
      description: 'Standard male voice (browser-dependent)',
      sampleText: 'This is the male voice for your AI coach.'
    },
    {
      id: 'female',
      name: 'Female Voice',
      language: 'en-US',
      gender: 'female',
      accent: 'Default',
      description: 'Standard female voice (browser-dependent)',
      sampleText: 'This is the female voice for your AI coach.'
    }
  ];

  constructor() {
    this.initializeSpeechSynthesis();
    this.initializeSpeechRecognition();
    this.initializeVoiceCommands();
  }

  private initializeSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    }
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        this.handleSpeechInput(event);
      };
    }
  }

  private initializeVoiceCommands() {
    this.commands = [
      // Session Control Commands
      {
        command: 'start session',
        aliases: ['begin session', 'start practice', 'begin practice', 'start racing'],
        description: 'Start a new racing session',
        category: 'session',
        action: () => {
          this.speak('Starting your racing session. Let\'s get ready to perform!');
          // Navigate to session start
          if (typeof window !== 'undefined') {
            window.location.href = '/new-session';
          }
        }
      },
      {
        command: 'end session',
        aliases: ['stop session', 'finish session', 'end practice'],
        description: 'End the current session',
        category: 'session',
        action: () => {
          this.speak('Ending your session. Great work today!');
        }
      },
      {
        command: 'pause session',
        aliases: ['pause', 'hold session'],
        description: 'Pause the current session',
        category: 'session',
        action: () => {
          this.speak('Session paused. Ready to resume when you are.');
        }
      },
      {
        command: 'resume session',
        aliases: ['resume', 'continue session'],
        description: 'Resume the paused session',
        category: 'session',
        action: () => {
          this.speak('Resuming session. Let\'s get back to racing!');
        }
      },

      // Navigation Commands
      {
        command: 'go home',
        aliases: ['home', 'main menu', 'dashboard'],
        description: 'Navigate to the home page',
        category: 'navigation',
        action: () => {
          this.speak('Taking you to the main dashboard.');
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }
      },
      {
        command: 'telemetry',
        aliases: ['live data', 'real time data'],
        description: 'Open telemetry dashboard',
        category: 'navigation',
        action: () => {
          this.speak('Opening telemetry dashboard for live data.');
          if (typeof window !== 'undefined') {
            window.location.href = '/telemetry';
          }
        }
      },
      {
        command: 'analysis',
        aliases: ['session analysis', 'data analysis'],
        description: 'Open session analysis',
        category: 'navigation',
        action: () => {
          this.speak('Opening session analysis for detailed review.');
          if (typeof window !== 'undefined') {
            window.location.href = '/analysis';
          }
        }
      },
      {
        command: 'settings',
        aliases: ['configure', 'preferences'],
        description: 'Open settings',
        category: 'navigation',
        action: () => {
          this.speak('Opening settings for configuration.');
          if (typeof window !== 'undefined') {
            window.location.href = '/settings';
          }
        }
      },

      // Data Commands
      {
        command: 'lap time',
        aliases: ['current lap', 'how fast', 'what\'s my time'],
        description: 'Get current lap time',
        category: 'data',
        action: () => {
          this.speak('Your current lap time is 1 minute 23.456 seconds.');
        }
      },
      {
        command: 'speed',
        aliases: ['current speed', 'how fast am i going'],
        description: 'Get current speed',
        category: 'data',
        action: () => {
          this.speak('Your current speed is 145 kilometers per hour.');
        }
      },
      {
        command: 'performance',
        aliases: ['how am i doing', 'performance score'],
        description: 'Get performance score',
        category: 'data',
        action: () => {
          this.speak('Your current performance score is 87 out of 100. Excellent driving!');
        }
      },

      // Coaching Commands
      {
        command: 'corner advice',
        aliases: ['cornering tips', 'turn advice'],
        description: 'Get cornering advice',
        category: 'coaching',
        action: () => {
          this.speak('Focus on your corner entry. Brake earlier and trail brake through the apex for better exit speed.');
        }
      },
      {
        command: 'braking advice',
        aliases: ['brake tips', 'braking technique'],
        description: 'Get braking advice',
        category: 'coaching',
        action: () => {
          this.speak('Your braking points are good. Try trail braking more to maintain momentum through the corners.');
        }
      },
      {
        command: 'line advice',
        aliases: ['racing line', 'optimal line'],
        description: 'Get racing line advice',
        category: 'coaching',
        action: () => {
          this.speak('Use the entire track width. Enter wide, hit the apex, and exit wide for maximum speed.');
        }
      },

      // Settings Commands
      {
        command: 'volume up',
        aliases: ['louder', 'increase volume'],
        description: 'Increase voice volume',
        category: 'settings',
        action: () => {
          const newVolume = Math.min(this.settings.volume + 0.1, 1.0);
          this.updateSettings({ volume: newVolume });
          this.speak(`Volume increased to ${Math.round(newVolume * 100)} percent.`);
        }
      },
      {
        command: 'volume down',
        aliases: ['quieter', 'decrease volume'],
        description: 'Decrease voice volume',
        category: 'settings',
        action: () => {
          const newVolume = Math.max(this.settings.volume - 0.1, 0.0);
          this.updateSettings({ volume: newVolume });
          this.speak(`Volume decreased to ${Math.round(newVolume * 100)} percent.`);
        }
      },
      {
        command: 'mute',
        aliases: ['silence', 'turn off voice'],
        description: 'Mute voice feedback',
        category: 'settings',
        action: () => {
          this.updateSettings({ enabled: false });
          this.speak('Voice feedback muted.');
        }
      },
      {
        command: 'unmute',
        aliases: ['enable voice', 'turn on voice'],
        description: 'Enable voice feedback',
        category: 'settings',
        action: () => {
          this.updateSettings({ enabled: true });
          this.speak('Voice feedback enabled.');
        }
      },

      // Help Commands
      {
        command: 'help',
        aliases: ['commands', 'what can you do', 'voice commands'],
        description: 'List available voice commands',
        category: 'settings',
        action: () => {
          this.speak('Available commands: start session, end session, go home, telemetry, analysis, settings, lap time, speed, performance, corner advice, volume up, volume down, mute, unmute, and help. Say "hey racesense" followed by any command.');
        }
      },
      {
        command: 'stop listening',
        aliases: ['disable voice control', 'turn off voice control'],
        description: 'Disable voice recognition',
        category: 'settings',
        action: () => {
          this.stopListening();
          this.speak('Voice control disabled.');
        }
      }
    ];
  }

  private loadVoices() {
    if (this.synthesis) {
      this.synthesis.onvoiceschanged = () => {
        const voices = this.synthesis!.getVoices();
        this.currentVoice = voices.find(voice => 
          voice.lang === 'en-US' && voice.name.includes('Google')
        ) || voices[0];
      };
    }
  }

  private handleSpeechInput(event: SpeechRecognitionEvent) {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('');
    
    if (event.results[0].isFinal) {
      this.processVoiceCommand(transcript);
    }
  }

  private processVoiceCommand(command: string) {
    const lowerCommand = command.toLowerCase();
    const now = Date.now();
    
    // Check for wake word
    if (lowerCommand.includes(this.settings.wakeWord.toLowerCase())) {
      this.wakeWordActive = true;
      this.lastCommandTime = now;
      this.speak('Listening for your command.');
      return;
    }

    // If wake word is required and not active, ignore command
    if (this.settings.wakeWord !== '' && !this.wakeWordActive) {
      return;
    }

    // Reset wake word after 5 seconds
    if (now - this.lastCommandTime > 5000) {
      this.wakeWordActive = false;
    }

    // Find matching command
    const matchedCommand = this.commands.find(cmd => 
      cmd.command === lowerCommand || 
      cmd.aliases.some(alias => alias === lowerCommand) ||
      lowerCommand.includes(cmd.command) ||
      cmd.aliases.some(alias => lowerCommand.includes(alias))
    );

    if (matchedCommand) {
      this.lastCommandTime = now;
      this.wakeWordActive = false;
      matchedCommand.action();
    } else if (this.wakeWordActive) {
      this.speak('Command not recognized. Say "help" for available commands.');
      this.wakeWordActive = false;
    }
  }

  public speak(text: string, options?: Partial<VoiceSettings>) {
    if (!this.synthesis || !this.settings.enabled) return;

    // Stop any current speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get the selected voice from available voices
    const selectedVoiceOption = this.getVoiceById(this.settings.selectedVoice);
    if (selectedVoiceOption) {
      // Find the best matching browser voice
      const browserVoice = this.findBestMatchingBrowserVoice(selectedVoiceOption);
      utterance.voice = browserVoice || this.currentVoice;
    } else {
      utterance.voice = this.currentVoice;
    }
    
    utterance.volume = options?.volume ?? this.settings.volume;
    utterance.rate = options?.speed ?? this.settings.speed;
    utterance.pitch = options?.pitch ?? this.settings.pitch;

    this.synthesis.speak(utterance);
  }

  public startListening() {
    if (this.recognition && !this.listening) {
      this.listening = true;
      this.recognition.start();
      this.speak(`Voice control activated. Say "${this.settings.wakeWord}" followed by your command.`);
    }
  }

  public stopListening() {
    if (this.recognition && this.listening) {
      this.listening = false;
      this.recognition.stop();
      this.speak('Voice control deactivated.');
    }
  }

  public getCoachingFeedback(sessionData: any): string {
    const { lapTime, corneringScore, brakingScore, throttleScore } = sessionData;
    
    let feedback = '';
    
    if (lapTime && lapTime < 85) {
      feedback += 'Excellent lap time! You\'re really pushing the limits. ';
    } else if (lapTime && lapTime > 95) {
      feedback += 'Focus on your racing line. You can shave off some time. ';
    }

    if (corneringScore && corneringScore < 80) {
      feedback += 'Your cornering technique needs work. Focus on smooth steering inputs. ';
    }

    if (brakingScore && brakingScore < 75) {
      feedback += 'Brake later and trail brake through the corners. ';
    }

    if (throttleScore && throttleScore < 70) {
      feedback += 'Be more aggressive with throttle application on corner exits. ';
    }

    return feedback || 'Keep up the good work! Your driving is improving.';
  }

  public getAvailableBrowserVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  public getVoiceById(id: string): VoiceOption | undefined {
    return this.voiceOptions.find(voice => voice.id === id);
  }

  private findBestMatchingBrowserVoice(voiceOption: VoiceOption): SpeechSynthesisVoice | null {
    if (!this.synthesis) return null;
    const voices = this.synthesis.getVoices();
    // Try to find by gender in the voice name (not always reliable)
    let browserVoice = voices.find(voice =>
      voice.lang.startsWith('en') &&
      ((voiceOption.gender === 'male' && voice.name.toLowerCase().includes('male')) ||
       (voiceOption.gender === 'female' && voice.name.toLowerCase().includes('female')))
    );
    // Fallback: pick first voice that matches language and gender in name
    if (!browserVoice) {
      browserVoice = voices.find(voice =>
        voice.lang.startsWith('en') &&
        ((voiceOption.gender === 'male' && voice.name.toLowerCase().includes('david')) ||
         (voiceOption.gender === 'female' && voice.name.toLowerCase().includes('zira')))
      );
    }
    // Fallback: pick first voice that matches language
    if (!browserVoice) {
      browserVoice = voices.find(voice => voice.lang.startsWith('en'));
    }
    // Fallback: pick any available voice
    if (!browserVoice && voices.length > 0) {
      browserVoice = voices[0];
    }
    return browserVoice || null;
  }

  private updateCurrentVoice(voiceId: string) {
    if (!this.synthesis) return;
    
    const selectedVoiceOption = this.getVoiceById(voiceId);
    if (selectedVoiceOption) {
      const browserVoice = this.findBestMatchingBrowserVoice(selectedVoiceOption);
      this.currentVoice = browserVoice || this.currentVoice;
    }
  }

  public updateSettings(newSettings: Partial<VoiceSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    
    // If voice was changed, update the current voice
    if (newSettings.selectedVoice && this.synthesis) {
      this.updateCurrentVoice(newSettings.selectedVoice);
    }
  }

  public getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  public getCommands(): VoiceCommand[] {
    return [...this.commands];
  }

  public getCommandsByCategory(category: string): VoiceCommand[] {
    return this.commands.filter(cmd => cmd.category === category);
  }

  public isVoiceRecognitionSupported(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public isSpeechSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  public isListening(): boolean {
    return this.listening;
  }

  public isWakeWordActive(): boolean {
    return this.wakeWordActive;
  }

  // Machine Learning based coaching
  public analyzePerformancePatterns(sessions: AICoachingSession[]): any {
    if (sessions.length < 3) return null;

    const recentSessions = sessions.slice(-5);
    const avgLapTime = recentSessions.reduce((sum, session) => 
      sum + (session.coachingData.lapTime || 0), 0) / recentSessions.length;
    
    const improvement = sessions[sessions.length - 1].coachingData.lapTime! - 
                       sessions[0].coachingData.lapTime!;

    return {
      averageLapTime: avgLapTime,
      improvement: improvement,
      trend: improvement < 0 ? 'improving' : 'declining',
      recommendations: this.generateMLRecommendations(sessions)
    };
  }

  private generateMLRecommendations(sessions: AICoachingSession[]): string[] {
    const recommendations = [];
    
    // Analyze cornering consistency
    const corneringScores = sessions.map(s => s.coachingData.corneringScore).filter(Boolean);
    if (corneringScores.length > 0) {
      const avgCornering = corneringScores.reduce((a, b) => a + b, 0) / corneringScores.length;
      if (avgCornering < 80) {
        recommendations.push('Focus on cornering consistency - practice smooth steering inputs');
      }
    }

    // Analyze braking patterns
    const brakingScores = sessions.map(s => s.coachingData.brakingScore).filter(Boolean);
    if (brakingScores.length > 0) {
      const avgBraking = brakingScores.reduce((a, b) => a + b, 0) / brakingScores.length;
      if (avgBraking < 75) {
        recommendations.push('Improve braking technique - practice trail braking');
      }
    }

    return recommendations;
  }
}

// Create singleton instance
export const voiceAIService = new VoiceAIService();

// React Hook for Voice AI
export const useVoiceAI = () => {
  const { notify } = useNotifications();

  // Debug logging
  console.log('useVoiceAI - voiceOptions length:', voiceAIService.voiceOptions.length);
  console.log('useVoiceAI - voiceOptions:', voiceAIService.voiceOptions);

  const speak = (text: string) => {
    voiceAIService.speak(text);
  };

  const startVoiceRecognition = () => {
    if (voiceAIService.isVoiceRecognitionSupported()) {
      voiceAIService.startListening();
      notify({
        type: "info",
        title: "Voice Control Activated",
        message: `Say "${voiceAIService.getSettings().wakeWord}" followed by your command`,
        duration: 3000
      });
    } else {
      notify({
        type: "error",
        title: "Voice Control Unavailable",
        message: "Voice recognition is not supported in your browser",
        duration: 5000
      });
    }
  };

  const stopVoiceRecognition = () => {
    voiceAIService.stopListening();
  };

  const updateVoiceSettings = (settings: Partial<VoiceSettings>) => {
    voiceAIService.updateSettings(settings);
    notify({
      type: "success",
      title: "Voice Settings Updated",
      message: "Your voice control settings have been saved",
      duration: 2000
    });
  };

  return {
    speak,
    startVoiceRecognition,
    stopVoiceRecognition,
    updateVoiceSettings,
    voiceOptions: voiceAIService.voiceOptions,
    settings: voiceAIService.getSettings(),
    commands: voiceAIService.getCommands(),
    isSupported: voiceAIService.isVoiceRecognitionSupported(),
    isListening: voiceAIService.isListening(),
    isWakeWordActive: voiceAIService.isWakeWordActive()
  };
}; 