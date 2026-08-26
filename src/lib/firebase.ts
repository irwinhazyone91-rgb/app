import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  query, 
  orderBy,
  writeBatch
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { ServiceTicket, Product, Transaction, StoreSettings, User } from "../types";

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
export const auth = getAuth(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connectivity on initial load
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "settings", "store_config"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore client is offline or initializing.");
    }
    return false;
  }
}

// Collections Definitions
export const COLLECTIONS = {
  TICKETS: "service_tickets",
  PRODUCTS: "products",
  TRANSACTIONS: "transactions",
  SETTINGS: "settings",
  USERS: "users",
};

// Firestore Sync Services for ServisKu
export const firestoreService = {
  // Sync Service Ticket
  async saveTicket(ticket: ServiceTicket): Promise<void> {
    const path = `${COLLECTIONS.TICKETS}/${ticket.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.TICKETS, ticket.id), ticket, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteTicket(ticketId: string): Promise<void> {
    const path = `${COLLECTIONS.TICKETS}/${ticketId}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.TICKETS, ticketId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Sync Product
  async saveProduct(product: Product): Promise<void> {
    const path = `${COLLECTIONS.PRODUCTS}/${product.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), product, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteProduct(productId: string): Promise<void> {
    const path = `${COLLECTIONS.PRODUCTS}/${productId}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Sync Transaction
  async saveTransaction(transaction: Transaction): Promise<void> {
    const path = `${COLLECTIONS.TRANSACTIONS}/${transaction.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.TRANSACTIONS, transaction.id), transaction, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Sync Store Settings
  async saveSettings(settings: StoreSettings): Promise<void> {
    const path = `${COLLECTIONS.SETTINGS}/store_config`;
    try {
      await setDoc(doc(db, COLLECTIONS.SETTINGS, "store_config"), settings, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Sync User
  async saveUser(user: User): Promise<void> {
    const path = `${COLLECTIONS.USERS}/${user.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, user.id), user, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteUser(userId: string): Promise<void> {
    const path = `${COLLECTIONS.USERS}/${userId}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Batch seed all initial local data to Firestore if cloud is empty
  async seedInitialDataIfEmpty(
    initialTickets: ServiceTicket[],
    initialProducts: Product[],
    initialTransactions: Transaction[],
    initialSettings: StoreSettings,
    initialUsers: User[]
  ): Promise<void> {
    try {
      const ticketsSnap = await getDocs(collection(db, COLLECTIONS.TICKETS));
      if (ticketsSnap.empty && initialTickets.length > 0) {
        const batch = writeBatch(db);
        initialTickets.forEach(t => batch.set(doc(db, COLLECTIONS.TICKETS, t.id), t));
        initialProducts.forEach(p => batch.set(doc(db, COLLECTIONS.PRODUCTS, p.id), p));
        initialTransactions.forEach(tx => batch.set(doc(db, COLLECTIONS.TRANSACTIONS, tx.id), tx));
        batch.set(doc(db, COLLECTIONS.SETTINGS, "store_config"), initialSettings);
        initialUsers.forEach(u => batch.set(doc(db, COLLECTIONS.USERS, u.id), u));
        await batch.commit();
        console.log("Initial data successfully seeded to Firestore database.");
      }
    } catch (err) {
      console.warn("Firestore seed check notice:", err);
    }
  },

  // Listeners for Realtime Firestore Changes
  subscribeToTickets(onUpdate: (tickets: ServiceTicket[]) => void) {
    const q = collection(db, COLLECTIONS.TICKETS);
    return onSnapshot(q, (snapshot) => {
      const tickets: ServiceTicket[] = [];
      snapshot.forEach(doc => {
        tickets.push(doc.data() as ServiceTicket);
      });
      if (tickets.length > 0) {
        onUpdate(tickets);
      }
    }, (err) => {
      console.warn("Tickets snapshot listener notice:", err);
    });
  },

  subscribeToProducts(onUpdate: (products: Product[]) => void) {
    const q = collection(db, COLLECTIONS.PRODUCTS);
    return onSnapshot(q, (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach(doc => {
        products.push(doc.data() as Product);
      });
      if (products.length > 0) {
        onUpdate(products);
      }
    }, (err) => {
      console.warn("Products snapshot listener notice:", err);
    });
  },

  subscribeToTransactions(onUpdate: (transactions: Transaction[]) => void) {
    const q = collection(db, COLLECTIONS.TRANSACTIONS);
    return onSnapshot(q, (snapshot) => {
      const transactions: Transaction[] = [];
      snapshot.forEach(doc => {
        transactions.push(doc.data() as Transaction);
      });
      if (transactions.length > 0) {
        onUpdate(transactions);
      }
    }, (err) => {
      console.warn("Transactions snapshot listener notice:", err);
    });
  },

  subscribeToSettings(onUpdate: (settings: StoreSettings) => void) {
    return onSnapshot(doc(db, COLLECTIONS.SETTINGS, "store_config"), (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as StoreSettings);
      }
    }, (err) => {
      console.warn("Settings snapshot listener notice:", err);
    });
  },

  subscribeToUsers(onUpdate: (users: User[]) => void) {
    const q = collection(db, COLLECTIONS.USERS);
    return onSnapshot(q, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach(doc => {
        users.push(doc.data() as User);
      });
      if (users.length > 0) {
        onUpdate(users);
      }
    }, (err) => {
      console.warn("Users snapshot listener notice:", err);
    });
  }
};
