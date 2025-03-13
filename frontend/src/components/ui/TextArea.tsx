import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const textareaClasses = `
    px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 
    focus:outline-none focus:border-blue-500 focus:ring-blue-500 block rounded-md sm:text-sm focus:ring-1 resize-y
    ${error ? 'border-red-500' : ''}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;
  
  return (
    <div className={`mb-4 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea className={textareaClasses} {...props} />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default TextArea; 