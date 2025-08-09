import React, { useState, useEffect } from 'react';

export const useConclusionsService = () => {
  const [conclusions, setConclusions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const loadConclusions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test server connectivity first
      const healthResponse = await fetch('http://localhost:8000/health');
      console.log('Health check status:', healthResponse.status);
      
      if (!healthResponse.ok) {
        throw new Error('Server is not responding - make sure Server.py is running');
      }

      // Now fetch conclusions
      const response = await fetch('http://localhost:8000/api/conclusions');
      
      setDebugInfo({
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        url: response.url
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setConclusions(data.conclusions || []);
      
    } catch (err) {
      console.error('Error loading conclusions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ADD: Missing fetchConclusionDetail function
  const fetchConclusionDetail = async (filename) => {
    try {
      console.log('Fetching detail for:', filename);
      
      const response = await fetch(`http://localhost:8000/api/conclusions/${filename}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Successfully fetched conclusion detail:', data);
      return data;
      
    } catch (err) {
      console.error('Error fetching conclusion detail:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadConclusions();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'unstable': return 'text-red-600 bg-red-100';
      case 'improving': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return {
    conclusions,
    loading,
    error,
    debugInfo,
    fetchConclusions: loadConclusions,
    fetchConclusionDetail, // ADD: Return the missing function
    getStatusColor,
    getHealthColor
  };
};