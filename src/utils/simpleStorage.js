/**
 * Simple storage utility using IndexedDB with a localStorage-like API
 */

const DB_NAME = 'aster_files_db';
const STORE_NAME = 'files';
const DB_VERSION = 1;

// Open the database connection
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Failed to open database');
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

/**
 * Store data with a key (similar to localStorage.setItem)
 * @param {string} key - Storage key
 * @param {any} data - Data to store (will be stringified)
 * @returns {Promise} - Resolves when storage is complete
 */
const setItem = async (key, data) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Convert data to JSON string just like localStorage would
      const request = store.put(JSON.stringify(data), key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error storing data:', error);
    throw error;
  }
};

/**
 * Retrieve data by key (similar to localStorage.getItem)
 * @param {string} key - Storage key
 * @returns {Promise<any>} - Resolves with retrieved data (parsed from JSON)
 */
const getItem = async (key) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => {
        // Parse JSON string back to object, just like localStorage would
        try {
          const data = request.result ? JSON.parse(request.result) : null;
          resolve(data);
        } catch (e) {
          resolve(request.result); // Return as-is if not JSON
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error retrieving data:', error);
    return null;
  }
};

/**
 * Remove data by key (similar to localStorage.removeItem)
 * @param {string} key - Storage key
 * @returns {Promise} - Resolves when removal is complete
 */
const removeItem = async (key) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error removing data:', error);
    throw error;
  }
};

/**
 * Get the size of all stored data
 * @returns {Promise<number>} - Resolves with size in bytes
 */
const getStorageSize = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      
      request.onsuccess = async () => {
        const keys = request.result;
        let totalSize = 0;
        
        for (const key of keys) {
          const valueRequest = store.get(key);
          await new Promise(resolve => {
            valueRequest.onsuccess = () => {
              if (valueRequest.result) {
                totalSize += String(valueRequest.result).length;
              }
              resolve();
            };
            valueRequest.onerror = () => resolve();
          });
        }
        
        resolve(totalSize);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return 0;
  }
};

/**
 * Clear all data from storage
 * @returns {Promise} - Resolves when clearing is complete
 */
const clear = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

// Export a simple API that resembles localStorage
export default {
  setItem,
  getItem,
  removeItem,
  clear,
  getStorageSize
};