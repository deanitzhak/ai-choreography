import React, { useState } from 'react';
import { Copy, FileText } from 'lucide-react';
import { formatCode, getLanguageFromExtension, getLanguageStyles } from '../../utils/codeFormatter';

/**
 * Syntax highlighter component
 * @param {object} props - Component props
 * @param {string} props.code - Code content
 * @param {string} props.language - Programming language
 * @param {string} props.filename - Filename
 * @param {boolean} props.showLineNumbers - Whether to show line numbers
 * @param {number} props.maxHeight - Maximum height in pixels
 * @returns {JSX.Element} - CodeBlock component
 */
export const CodeBlock = ({ 
  code, 
  language, 
  filename, 
  showLineNumbers = false,
  maxHeight = null 
}) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };
  
  const detectedLanguage = language || getLanguageFromExtension(filename || '');
  const formattedCode = formatCode(code, detectedLanguage);
  const languageStyles = getLanguageStyles(detectedLanguage);
  
  // Split code into lines for line numbering
  const codeLines = formattedCode.split('\n');
  
  const containerStyle = maxHeight ? { maxHeight: `${maxHeight}px` } : {};
  
  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <FileText size={16} className="text-blue-400" />
          <span className="text-sm text-gray-300 truncate">{filename}</span>
          <span className={`text-xs px-2 py-1 rounded ${languageStyles.bgColor} ${languageStyles.color}`}>
            {languageStyles.icon} {detectedLanguage}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {codeLines.length} lines
          </span>
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
            title="Copy to clipboard"
          >
            <Copy size={16} />
            <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
      
      {/* Code Content */}
      <div 
        className="bg-gray-900 rounded-b-lg overflow-auto text-sm"
        style={containerStyle}
      >
        <pre className="p-4">
          <code className={`language-${detectedLanguage} text-gray-100`}>
            {showLineNumbers ? (
              <div className="flex">
                {/* Line Numbers */}
                <div className="text-gray-500 text-right pr-4 select-none">
                  {codeLines.map((_, index) => (
                    <div key={index} className="leading-6">
                      {index + 1}
                    </div>
                  ))}
                </div>
                {/* Code Content */}
                <div className="flex-1">
                  {codeLines.map((line, index) => (
                    <div key={index} className="leading-6">
                      {line || '\u00A0'} {/* Non-breaking space for empty lines */}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              formattedCode
            )}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;