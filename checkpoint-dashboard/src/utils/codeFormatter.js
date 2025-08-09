/**
 * Code formatter utility function
 * @param {string} code - The raw code string
 * @param {string} language - The programming language
 * @returns {string} - Formatted code string
 */
export const formatCode = (code, language = 'python') => {
  if (!code) return '';
  
  // Basic Python code formatting
  if (language === 'python' || language === 'py') {
    return code
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '  ')
      .replace(/\\"([^"]*?)\\"/g, '"$1"')
      .replace(/\\'/g, "'")
      .trim();
  }
  
  // Basic JavaScript/JSX formatting
  if (language === 'javascript' || language === 'jsx' || language === 'js') {
    return code
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '  ')
      .trim();
  }
  
  // YAML/JSON formatting
  if (language === 'yaml' || language === 'yml' || language === 'json') {
    try {
      if (language === 'json') {
        const parsed = JSON.parse(code);
        return JSON.stringify(parsed, null, 2);
      }
    } catch (e) {
      // Return as-is if parsing fails
      console.warn('Failed to format JSON:', e);
    }
  }
  
  return code.trim();
};

/**
 * Get programming language from file extension
 * @param {string} filename - The filename with extension
 * @returns {string} - Detected programming language
 */
export const getLanguageFromExtension = (filename) => {
  if (!filename) return 'text';
  
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap = {
    'py': 'python',
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'yaml': 'yaml',
    'yml': 'yaml',
    'json': 'json',
    'md': 'markdown',
    'txt': 'text',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'xml': 'xml',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash'
  };
  
  return languageMap[ext] || 'text';
};

/**
 * Get language-specific syntax highlighting classes
 * @param {string} language - Programming language
 * @returns {object} - Object with styling information
 */
export const getLanguageStyles = (language) => {
  const styles = {
    python: {
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      icon: '🐍'
    },
    javascript: {
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      icon: '⚡'
    },
    typescript: {
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      icon: '📘'
    },
    yaml: {
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      icon: '⚙️'
    },
    json: {
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/20',
      icon: '📋'
    },
    markdown: {
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      icon: '📝'
    },
    text: {
      color: 'text-gray-400',
      bgColor: 'bg-gray-900/20',
      icon: '📄'
    }
  };
  
  return styles[language] || styles.text;
};

/**
 * Service for fetching files from server
 */
export const CodeService = {
  baseUrl: 'http://localhost:8000',
  
  async getFileStructure() {
    try {
      console.log('🔍 Fetching file structure...');
      
      // First test the connection
      const testResponse = await fetch(`${this.baseUrl}/api/debug/test`);
      if (!testResponse.ok) {
        throw new Error(`Server not responding: ${testResponse.status}`);
      }
      
      // Now get the file structure
      const response = await fetch(`${this.baseUrl}/api/debug/list`);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText.substring(0, 200));
        throw new Error(`Server error: ${response.status} - ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON');
      }
      
      const data = await response.json();
      console.log('✅ Successfully received file structure:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Error in getFileStructure:', error);
      throw error;
    }
  },
  
  async getFileContent(filePath) {
    try {
      console.log('🔍 Fetching file content for:', filePath);
      
      const response = await fetch(`${this.baseUrl}/api/files/${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch file: ${response.status} - ${errorText}`);
      }
      
      const content = await response.text();
      console.log('✅ Successfully received file content');
      return content;
      
    } catch (error) {
      console.error('❌ Error in getFileContent:', error);
      throw error;
    }
  },
  
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/debug/test`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};