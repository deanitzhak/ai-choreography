import { useState, useEffect } from 'react';
import CheckpointService from '../components/checkpoints/CheckpointService';

export const useCheckpoints = () => {
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCheckpoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CheckpointService.getCheckpoints();
      setCheckpoints(data);
    } catch (error) {
      console.error('Failed to load checkpoints:', error);
      setError('Failed to load checkpoint data. Please check your server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckpoints();
  }, []);

  return {
    checkpoints,
    loading,
    error,
    refetch: loadCheckpoints
  };
};
