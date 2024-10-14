import axios from 'axios';
import { useMemo } from 'react';

import { useSettingsStore } from '@/store/settings_store';
import { useUserStore } from '@/store/user_store';

export const useApi = () => {
  const serverUrl = useSettingsStore((state) => state.serverUrl);
  const token = useUserStore((state) => state.token);
  const apiTimeout = useSettingsStore((state) => state.apiTimeout);

  return useMemo(() => {
    const createApiCall =
      (method) =>
      (endpoint, params = {}) => {
        const headers = {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        };

        const config = {
          method,
          url: `${serverUrl}/api${endpoint}`,
          headers,
          timeout: apiTimeout * 1000,
          ...(method === 'GET' ? { params } : { data: params }),
        };

        return axios(config).then((response) => response.data);
      };

    return {
      get: createApiCall('GET'),
      post: createApiCall('POST'),
      put: createApiCall('PUT'),
      delete: createApiCall('DELETE'),
    };
  }, [serverUrl, token, apiTimeout]);
};
