interface TranscriptEntry {
  speaker: 'user' | 'twin';
  text: string;
  timestamp: Date;
}

interface TranscriptDisplayProps {
  transcript: TranscriptEntry[];
  voiceName: string | null;
}

const TranscriptDisplay = ({
  transcript,
  voiceName,
}: TranscriptDisplayProps) => {
  return (
    <div className="flex flex-col gap-4 h-[500px] overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      {transcript.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>Start speaking to begin the interview...</p>
        </div>
      ) : (
        transcript.map((entry, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                entry.speaker === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold opacity-70">
                  {entry.speaker === 'user'
                    ? 'You'
                    : `Voice Twin${voiceName ? ` (${voiceName})` : ''}`}
                </span>
                <span className="text-xs opacity-50">
                  {entry.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{entry.text}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TranscriptDisplay;
