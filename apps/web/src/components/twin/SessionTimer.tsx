interface SessionTimerProps {
  timeRemaining: number;
}

const SessionTimer = ({ timeRemaining }: SessionTimerProps) => {
  const isWarning = timeRemaining <= 1;
  const minutes = Math.floor(timeRemaining);
  const percentage = (timeRemaining / 15) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Session Time
        </span>
        <span
          className={`text-2xl font-bold ${isWarning ? 'text-red-600 animate-pulse' : 'text-gray-900 dark:text-white'}`}
        >
          {minutes}:00
        </span>
      </div>

      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isWarning ? 'bg-red-600' : 'bg-blue-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isWarning && (
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
          ⚠️ Session ending soon. Please wrap up your questions.
        </p>
      )}
    </div>
  );
};

export default SessionTimer;
