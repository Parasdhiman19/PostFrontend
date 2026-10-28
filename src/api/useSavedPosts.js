import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'blogspace_saved_posts';
const EVENT_NAME = 'blogspace_saved_changed';

function getStoredSavedIds() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Custom hook to manage saved/bookmarked post IDs in localStorage.
 * Automatically synchronizes across components using a custom window event.
 */
export function useSavedPosts() {
  const [savedIds, setSavedIds] = useState(getStoredSavedIds);

  useEffect(() => {
    const handleSync = () => {
      setSavedIds(getStoredSavedIds());
    };

    window.addEventListener(EVENT_NAME, handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener(EVENT_NAME, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const persist = (nextIds) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch {
      // Ignore storage write error
    }
  };

  const isSaved = useCallback(
    (id) => savedIds.some((savedId) => String(savedId) === String(id)),
    [savedIds]
  );

  const toggleSave = useCallback(
    (id) => {
      setSavedIds((prev) => {
        const idStr = String(id);
        const exists = prev.some((sId) => String(sId) === idStr);
        const updated = exists
          ? prev.filter((sId) => String(sId) !== idStr)
          : [...prev, id];
        persist(updated);
        return updated;
      });
    },
    []
  );

  const removeSaved = useCallback((id) => {
    setSavedIds((prev) => {
      const updated = prev.filter((sId) => String(sId) !== String(id));
      persist(updated);
      return updated;
    });
  }, []);

  const clearAllSaved = useCallback(() => {
    setSavedIds([]);
    persist([]);
  }, []);

  return {
    savedIds,
    savedCount: savedIds.length,
    isSaved,
    toggleSave,
    removeSaved,
    clearAllSaved,
  };
}
