import { useState, useEffect } from 'react';

/**
 * Smooth typing animation for "Bezig..." text
 * Creates a typewriter effect that continuously loops
 */
function TypingAnimation({ text = 'Bezig' }) {
    const [displayText, setDisplayText] = useState('');
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        let currentIndex = 0;
        let isDeleting = false;
        const fullText = text + '...';

        const typeInterval = setInterval(() => {
            if (!isDeleting) {
                // Typing forward
                if (currentIndex <= fullText.length) {
                    setDisplayText(fullText.substring(0, currentIndex));
                    currentIndex++;
                } else {
                    // Pause at end before deleting
                    setTimeout(() => {
                        isDeleting = true;
                    }, 800);
                }
            } else {
                // Deleting backward
                if (currentIndex > 0) {
                    currentIndex--;
                    setDisplayText(fullText.substring(0, currentIndex));
                } else {
                    // Start over
                    isDeleting = false;
                }
            }
        }, isDeleting ? 50 : 150); // Faster delete, slower type

        // Cursor blink
        const cursorInterval = setInterval(() => {
            setShowCursor(prev => !prev);
        }, 500);

        return () => {
            clearInterval(typeInterval);
            clearInterval(cursorInterval);
        };
    }, [text]);

    return (
        <span className="inline-flex items-baseline font-mono">
            {displayText}
            <span className={`inline-block w-[2px] h-3 bg-current ml-0.5 ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
        </span>
    );
}

export default TypingAnimation;
