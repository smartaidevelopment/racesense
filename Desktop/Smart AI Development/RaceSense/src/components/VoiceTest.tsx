import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import { useVoiceAI } from '@/services/VoiceAIService';

const VoiceTest: React.FC = () => {
  const { voiceOptions, speak, settings } = useVoiceAI();

  const handleTestVoice = (voice: any) => {
    speak(voice.sampleText);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Voice Test - {voiceOptions.length} Voices Available</CardTitle>
          <p className="text-gray-500 text-sm mt-2">
            The actual sound of each voice depends on your browser and system settings. Only one male and one female voice are available.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {voiceOptions.map((voice) => (
              <Card key={voice.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{voice.name}</h4>
                      <p className="text-sm text-gray-600">{voice.description}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleTestVoice(voice)}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">"{voice.sampleText}"</p>
                  {settings.selectedVoice === voice.id && (
                    <Badge className="mt-2">Selected</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceTest; 