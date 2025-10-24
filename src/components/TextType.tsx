import React, { useState, useEffect } from 'react';

interface TextTypeProps {
  text: string | string[];
  typingSpeed?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  showCursor?: boolean;
  cursorCharacter?: string;
  variableSpeed?: boolean;
  className?: string;
}

const TextType: React.FC<TextTypeProps> = ({
  text,
  typingSpeed = 100,
  pauseDuration = 1000,
  deletingSpeed = 50,
  loop = true,
  showCursor = true,
  cursorCharacter = '|',
  variableSpeed = false,
  className = ''
}) => {
  const textArray = Array.isArray(text) ? text : [text];
  const fullText = textArray.join('\n'); // Unisco tutto il testo con newline
  
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Effetto per gestire l'hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isTyping && displayText.length < fullText.length) {
      // Continua a digitare
      const nextChar = fullText[displayText.length];
      const speed = variableSpeed 
        ? typingSpeed + Math.random() * 100 - 50 
        : typingSpeed;
      
      timeout = setTimeout(() => {
        setDisplayText(prev => prev + nextChar);
      }, speed);
    } else if (displayText.length === fullText.length) {
      // Testo completato, ferma l'animazione
      setIsTyping(false);
    }

    return () => clearTimeout(timeout);
  }, [displayText, fullText, isTyping, typingSpeed, variableSpeed]);

  // Converto i \n in <br /> per la visualizzazione mantenendo il gradiente
  const formatText = (text: string) => {
    // Sostituisco i \n con <br /> ma mantengo tutto in un unico span per il gradiente
    const parts = text.split('\n');
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < parts.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <span 
      className={className} 
      style={isHydrated ? {
        background: 'linear-gradient(135deg, #0ea5e9, #0284c7, #0369a1)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        display: 'inline-block',
        lineHeight: '1.2',
        minHeight: '1.2em'
      } : {
        display: 'inline-block',
        lineHeight: '1.2',
        minHeight: '1.2em'
      }}
    >
      {displayText ? formatText(displayText) : '\u00A0'}
      {showCursor && (
        <span 
          className="animate-blink" 
          style={isHydrated ? { color: '#0ea5e9' } : {}}
        >
          {cursorCharacter}
        </span>
      )}
    </span>
  );
};

export default TextType;