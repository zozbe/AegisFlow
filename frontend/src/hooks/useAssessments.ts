import { useCallback, useEffect, useState } from 'react';
import { RiskAssessment } from '../types';
import { getAssessments } from '../services/api';

export function useAssessments() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [userList, setUserList] = useState<string[]>([]);

  const fetchData = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAssessments(
        userId === '' ? undefined : userId
      );

      setAssessments(data);

      if (userId === '') {
        const uniqueUsers = Array.from(
          new Set(data.map((assessment) => assessment.user_id))
        ).sort();

        setUserList(uniqueUsers);
      }

      setLoading(false);
    } catch (err) {
      console.error('Veri çekilemedi:', err);
      setError(
        'SOC Engine ile bağlantı kurulamadı. Backend servisinin (FastAPI) çalıştığından emin olun.'
      );
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedUser);
  }, [selectedUser, fetchData]);

  const refetch = useCallback(() => {
    fetchData(selectedUser);
  }, [fetchData, selectedUser]);

  return {
    assessments,
    loading,
    error,
    selectedUser,
    setSelectedUser,
    userList,
    refetch,
  };
}