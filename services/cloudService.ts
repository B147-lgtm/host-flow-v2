
/**
 * HostFlow Universal Cloud Sync Service
 * 
 * This service handles the "Magic" of syncing your data across devices.
 * It treats each user's email as a unique path to their private cloud storage.
 */

const BUCKET_ID = "hostflow_v9_global_sync"; 
const LOCAL_DISCOVERY_KEY = "hostflow_known_accounts";

/**
 * Creates a unique digital signature for the user's account based on their email.
 */
const getCloudKey = (email: string, password: string): string => {
  const cleanEmail = email.trim().toLowerCase();
  const seed = `${cleanEmail}:${password.trim()}`;
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const absHash = Math.abs(hash).toString(16);
  return `user_${absHash}_${absHash.split('').reverse().join('')}`;
};

/**
 * Creates a discovery key derived only from the email to check if an account exists.
 */
const getDiscoveryKey = (email: string): string => {
  const cleanEmail = email.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < cleanEmail.length; i++) {
    const char = cleanEmail.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `exists_${Math.abs(hash).toString(16)}`;
};

export const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return "Mobile Device";
  if (/iPad|Android|Tablet/i.test(ua)) return "Tablet";
  return "Desktop Web";
};

export const cloudSync = {
  /**
   * Checks if an email is already registered.
   */
  async checkEmailExists(email: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    
    // 1. Check Local Device Hint (Fastest)
    const known = JSON.parse(localStorage.getItem(LOCAL_DISCOVERY_KEY) || "[]");
    if (known.includes(cleanEmail)) return true;

    // 2. Check Global Cloud Registry
    try {
      const key = getDiscoveryKey(email);
      const response = await fetch(`https://kvdb.io/${BUCKET_ID}/${key}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        // Update local hint for next time
        this.saveLocalHint(cleanEmail);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  /**
   * Registers that an email now has an account.
   */
  async registerEmail(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    this.saveLocalHint(cleanEmail);
    
    try {
      const key = getDiscoveryKey(email);
      await fetch(`https://kvdb.io/${BUCKET_ID}/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exists: true, registeredAt: Date.now() })
      });
    } catch (e) {
      console.warn("Cloud discovery registration delayed.");
    }
  },

  saveLocalHint(email: string) {
    const known = JSON.parse(localStorage.getItem(LOCAL_DISCOVERY_KEY) || "[]");
    if (!known.includes(email)) {
      known.push(email);
      localStorage.setItem(LOCAL_DISCOVERY_KEY, JSON.stringify(known));
    }
  },

  /**
   * PULL: Grabs your latest data from the cloud.
   */
  async pull(email: string, password: string): Promise<any | null> {
    try {
      const key = getCloudKey(email, password);
      const response = await fetch(`https://kvdb.io/${BUCKET_ID}/${key}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Cloud unreachable");
      
      return await response.json();
    } catch (error) {
      return null;
    }
  },

  /**
   * PUSH: Saves your changes to the cloud.
   */
  async push(email: string, password: string, data: any): Promise<boolean> {
    if (!data.currentUser) return false;

    const syncPackage = {
      ...data,
      lastActiveDevice: getDeviceName(),
      lastSyncedAt: Date.now()
    };

    try {
      const key = getCloudKey(email, password);
      const response = await fetch(`https://kvdb.io/${BUCKET_ID}/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncPackage)
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};
