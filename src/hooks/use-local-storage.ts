import { useState, useEffect } from "react";

/**
 * Check if localStorage is available
 * @returns boolean indicating if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__test_localStorage__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Custom hook for persisting state in localStorage
 * @param key The localStorage key to store the value under
 * @param initialValue The initial value to use if no value is found in localStorage
 * @returns A stateful value and a function to update it
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Check if localStorage is available
  const localStorageAvailable =
    typeof window !== "undefined" && isLocalStorageAvailable();

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!localStorageAvailable) {
      return initialValue;
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to local storage
      if (localStorageAvailable) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Update local storage if the key changes
  useEffect(() => {
    if (localStorageAvailable) {
      const item = window.localStorage.getItem(key);
      if (item) {
        try {
          setStoredValue(JSON.parse(item));
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error);
        }
      }
    }
  }, [key, localStorageAvailable]);

  return [storedValue, setValue];
}
