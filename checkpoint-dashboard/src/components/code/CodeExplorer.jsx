import React, { useState, useEffect } from 'react';
import { FileText, Folder, FolderOpen, Search, Eye, RefreshCw } from 'lucide-react';
import { CodeService } from '../../utils/codeFormatter';
import CodeBlock from './CodeBlock';

const CodeExplorer = () => {
  const [selectedCode, setSelectedCode] = useState('live_files');
  const [fileStructure, setFileStructure] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(['scripts', 'lib', 'routes']);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExplorer, setShowExplorer] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  // Load file structure on component mount
  useEffect(() => {
    if (selectedCode === 'live_files') {
      loadFileStructure();
    }
  }, [selectedCode]);

  // Check connection status
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const isConnected = await CodeService.testConnection();
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  };

  const loadFileStructure = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await CodeService.getFileStructure();
      if (data.status === 'success') {
        setFileStructure(data.files);
        console.log('📁 File structure loaded:', data);
        setConnectionStatus('connected');
      } else {
        setError(data.error || 'Failed to load file structure');
        setConnectionStatus('error');
      }
    } catch (err) {
      setError(err.message);
      setConnectionStatus('disconnected');
      console.error('Error loading file structure:', err);
    }
    setLoading(false);
  };

  const loadFileContent = async (filePath) => {
    setLoading(true);
    setError('');
    try {
      const content = await CodeService.getFileContent(filePath);
      setFileContent(content);
      setSelectedFile(filePath);
      setShowExplorer(false); // Hide explorer when viewing file
    } catch (err) {
      setError(err.message);
      console.error('Error loading file content:', err);
    }
    setLoading(false);
  };

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => 
      prev.includes(folderName) 
        ? prev.filter(f => f !== folderName)
        : [...prev, folderName]
    );
  };

  const filterFiles = (files) => {
    if (!searchTerm) return files;
    return files.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.path.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Static examples for fallback
  const staticExamples = {
    'debug_config': {
      language: 'python',
      filename: 'debug_config.py',
      code: `#!/usr/bin/env python3
"""Debug config requirements"""

import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.services.config_service import ConfigService

def debug_config_access():
    """Debug what config keys are being accessed"""
    config_path = "config/bailando_config_stable.yaml"
    config = ConfigService.load_config(config_path)
    
    print("🔍 Debugging config access patterns...")
    
    # Common patterns the training script might be looking for
    test_keys = [
        "training.learning_rate",
        "training.vq_vae_epochs", 
        "training.gpt_epochs",
        "training.batch_size",
        "training.save_interval",
        "model.motion_dim",
        "model.latent_dim",
        "data.dataset_path",
        "device"
    ]
    
    for key_path in test_keys:
        try:
            parts = key_path.split('.')
            value = config
            for part in parts:
                value = value[part]
            print(f"✅ {key_path}: {value}")
        except (KeyError, TypeError) as e:
            print(f"❌ {key_path}: Missing - {e}")
    
    print(f"\\n📋 Full config structure:")
    import json
    print(json.dumps(config, indent=2))

if __name__ == "__main__":
    debug_config_access()`
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      case 'error': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-semibold text-white">Code Explorer</h3>
          <div className={`text-xs px-2 py-1 rounded ${getConnectionStatusColor()} bg-gray-800`}>
            ● {connectionStatus}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedCode('live_files')}
            className={`px-3 py-1 rounded text-sm ${
              selectedCode === 'live_files' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Eye size={16} className="inline mr-1" />
            Live Files
          </button>
          <button
            onClick={() => setSelectedCode('debug_config')}
            className={`px-3 py-1 rounded text-sm ${
              selectedCode === 'debug_config' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <FileText size={16} className="inline mr-1" />
            Examples
          </button>
        </div>
      </div>

      {selectedCode === 'live_files' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* File Explorer Sidebar */}
          {showExplorer && (
            <div className="lg:col-span-1 bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-300">Project Files</h4>
                <button
                  onClick={loadFileStructure}
                  className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300"
                  disabled={loading}
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* File Tree */}
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {error && (
                  <div className="text-red-400 text-xs p-2 bg-red-900/20 rounded">
                    {error}
                  </div>
                )}
                
                {Object.entries(fileStructure).map(([folderName, files]) => (
                  <div key={folderName}>
                    <button
                      onClick={() => toggleFolder(folderName)}
                      className="flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-700 rounded text-sm"
                    >
                      {expandedFolders.includes(folderName) ? 
                        <FolderOpen size={16} className="text-yellow-400" /> : 
                        <Folder size={16} className="text-yellow-400" />
                      }
                      <span className="text-gray-300">{folderName}</span>
                      <span className="text-xs text-gray-500">({files.length})</span>
                    </button>
                    
                    {expandedFolders.includes(folderName) && (
                      <div className="ml-4 space-y-1">
                        {filterFiles(files).map((file) => (
                          <button
                            key={file.path}
                            onClick={() => loadFileContent(file.path)}
                            className="flex items-center space-x-2 w-full text-left p-1 hover:bg-gray-700 rounded text-xs"
                          >
                            <FileText size={14} className="text-blue-400" />
                            <span className="text-gray-400 truncate">{file.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Content */}
          <div className={showExplorer ? "lg:col-span-2" : "lg:col-span-3"}>
            {selectedFile && fileContent && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-300">
                    Viewing: {selectedFile}
                  </h4>
                  <button
                    onClick={() => setShowExplorer(!showExplorer)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {showExplorer ? 'Hide Explorer' : 'Show Explorer'}
                  </button>
                </div>
                <CodeBlock 
                  code={fileContent} 
                  filename={selectedFile}
                  showLineNumbers={true}
                  maxHeight={600}
                />
              </div>
            )}
            
            {!selectedFile && !loading && (
              <div className="text-center py-12 text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a file from the explorer to view its content</p>
              </div>
            )}
            
            {loading && (
              <div className="text-center py-12 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p>Loading...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCode === 'debug_config' && staticExamples[selectedCode] && (
        <CodeBlock 
          code={staticExamples[selectedCode].code}
          language={staticExamples[selectedCode].language}
          filename={staticExamples[selectedCode].filename}
          showLineNumbers={true}
        />
      )}
    </div>
  );
};

export default CodeExplorer;