import { useState } from 'react';
import CheckpointService from '../components/checkpoints/CheckpointService';

export const useCheckpointDetails = () => {
  const [checkpointDetails, setCheckpointDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCheckpointDetails = async (checkpointId) => {
    try {
      setLoading(true);
      setError(null);
      const details = await CheckpointService.getCheckpointDetails(checkpointId);
      setCheckpointDetails(details);
    } catch (error) {
      console.error('Failed to load checkpoint details:', error);
      setError('Failed to load checkpoint details.');
    } finally {
      setLoading(false);
    }
  };

  return {
    checkpointDetails,
    loading,
    error,
    loadCheckpointDetails
  };
};
