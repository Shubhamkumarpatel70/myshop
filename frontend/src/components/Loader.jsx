import React from 'react';

const Loader = ({ message = "Loading...", fullScreen = true }) => {
    const content = (
        <div className="flex flex-col items-center justify-center gap-4" role="status" aria-live="polite">
            <div className="flex items-center justify-center gap-2" aria-label="Loading">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-bounce" />
            </div>
            {message && <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>}
            <span className="sr-only">{message || "Loading..."}</span>
        </div>
    );

    if (!fullScreen) return content;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white/80 p-6 backdrop-blur-sm dark:bg-slate-950/80">
            {content}
        </div>
    );
};

export default Loader;
