import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if configured
export const firestoreDb: Firestore = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

export const firebaseAuth = getAuth(firebaseApp);

// Connection state
export interface FirebaseConnectionStatus {
  connected: boolean;
  checked: boolean;
  databaseId: string;
  projectId: string;
  error?: string;
}

export let connectionStatus: FirebaseConnectionStatus = {
  connected: false,
  checked: false,
  databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
  projectId: firebaseConfig.projectId || '',
};

/**
 * Validate connection to Firestore at app startup as instructed by guidelines
 */
export async function testFirestoreConnection(): Promise<FirebaseConnectionStatus> {
  try {
    await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
    connectionStatus = {
      connected: true,
      checked: true,
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
      projectId: firebaseConfig.projectId || '',
    };
  } catch (error: any) {
    // If the doc doesn't exist, it still connected to the server successfully!
    if (error && error.code === 'unavailable') {
      connectionStatus = {
        connected: false,
        checked: true,
        databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
        projectId: firebaseConfig.projectId || '',
        error: error.message,
      };
    } else {
      // Document not found is normal for connection testing, it confirms server contact
      connectionStatus = {
        connected: true,
        checked: true,
        databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
        projectId: firebaseConfig.projectId || '',
      };
    }
  }
  return connectionStatus;
}
