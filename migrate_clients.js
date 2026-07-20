import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCum5WobSVztOyPE5fijSt4Edrig2k00v8",
  authDomain: "kokos-web.firebaseapp.com",
  projectId: "kokos-web",
  storageBucket: "kokos-web.firebasestorage.app",
  messagingSenderId: "714849880120",
  appId: "1:714849880120:web:ce985c1ce79ab668b33ecd",
  measurementId: "G-SX009W4G8Z",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateClients() {
  console.log("Starting migration...");
  const clientsRef = collection(db, "clients");
  const snapshot = await getDocs(clientsRef);
  
  for (const clientDoc of snapshot.docs) {
    const data = clientDoc.data();
    if (data.uid && clientDoc.id !== data.uid) {
      console.log(`Migrating client ${data.email} from ${clientDoc.id} to ${data.uid}...`);
      // Create new document with uid as ID
      await setDoc(doc(db, "clients", data.uid), data);
      // Delete old document
      await deleteDoc(doc(db, "clients", clientDoc.id));
      console.log(`Migrated ${data.email} successfully.`);
    } else {
      console.log(`Skipping ${clientDoc.id} (no uid or already migrated)`);
    }
  }
  console.log("Migration complete.");
  process.exit(0);
}

migrateClients().catch(console.error);
