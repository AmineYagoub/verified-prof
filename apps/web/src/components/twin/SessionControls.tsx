interface SessionControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  onStart: () => void;
  onEnd: () => void;
}

const SessionControls = ({
  isConnected,
  isConnecting,
  onStart,
  onEnd,
}: SessionControlsProps) => {
  return (
    <div className="flex gap-4 justify-center">
      {!isConnected ? (
        <button
          onClick={onStart}
          disabled={isConnecting}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-3 text-lg"
        >
          {isConnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              Start Interview
            </>
          )}
        </button>
      ) : (
        <button
          onClick={onEnd}
          className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-3 text-lg"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
              clipRule="evenodd"
            />
          </svg>
          End Interview
        </button>
      )}
    </div>
  );
};

export default SessionControls;
