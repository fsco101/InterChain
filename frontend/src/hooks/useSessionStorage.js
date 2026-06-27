import { useState, useEffect } from 'react';

export function useSessionStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn('Error reading sessionStorage key “' + key + '”: ', error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Error setting sessionStorage key “' + key + '”: ', error);
    }
  }, [key, value]);

  return [value, setValue];
}
