import React, { useEffect } from 'react';

const LoadingHook = ({ setLoading }) => {
  useEffect(() => {
    setLoading(true);
    return () => {
      setLoading(false);
    };
  }, [setLoading]);

  return <></>;
};

export default LoadingHook;
