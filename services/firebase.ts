import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp
} from "firebase/firestore";
import { TeamRegistration, LiveChannel } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyAKnoCa3sKwZrQaUXy0PNkJ1FbsJGAOyjk",
  authDomain: "studio-3236344976-c8013.firebaseapp.com",
  databaseURL: "https://studio-3236344976-c8013-default-rtdb.firebaseio.com",
  projectId: "studio-3236344976-c8013",
  storageBucket: "studio-3236344976-c8013.firebasestorage.app",
  messagingSenderId: "689062563273",
  appId: "1:689062563273:web:32d10b4c3b24a62a81ac18"
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
// Initialize Firestore service explicitly with the initialized app
const db = getFirestore(app);

export const FirebaseService = {
  getLiveChannels: async (): Promise<LiveChannel[]> => {
    try {
      const q = query(collection(db, "live_channels"), where("is_active", "==", true));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveChannel));
    } catch (error: any) {
      console.error("Firebase Channels Error:", error);
      if (error.code === 'permission-denied' || error.message?.toLowerCase().includes('permission')) {
        throw new Error("PERMISSION_DENIED");
      }
      return [];
    }
  },

  getAllTeams: async (): Promise<TeamRegistration[]> => {
    try {
      const q = query(collection(db, "teams"), orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamRegistration));
    } catch (error: any) {
      console.error("Firebase Teams Error:", error);
      if (error.code === 'permission-denied' || error.message?.toLowerCase().includes('permission')) {
        throw new Error("PERMISSION_DENIED");
      }
      return [];
    }
  },

  registerTeam: async (teamData: Omit<TeamRegistration, 'id' | 'created_at'>) => {
    try {
      const teamToSave = {
        ...teamData,
        logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(teamData.team_name)}&background=random&color=fff&size=128`,
        wins: 0,
        losses: 0,
        bio: "فريق رياضي جديد.",
        created_at: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, "teams"), teamToSave);
      return { id: docRef.id, ...teamToSave, error: null };
    } catch (error: any) {
      console.error("Firebase Register Error:", error);
      if (error.code === 'permission-denied' || error.message?.toLowerCase().includes('permission')) {
        return { error: "PERMISSION_DENIED" };
      }
      return { error: error.message };
    }
  },

  loginTeam: async (email: string, password?: string) => {
    try {
      const q = query(collection(db, "teams"), where("contact_email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error("الحساب غير موجود.");
      }

      const team = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as TeamRegistration;
      
      if (password && team.password !== password) {
        throw new Error("كلمة المرور غير صحيحة.");
      }

      return { data: team, error: null };
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      if (error.code === 'permission-denied' || error.message?.toLowerCase().includes('permission')) {
        return { data: null, error: "PERMISSION_DENIED" };
      }
      return { data: null, error: error.message };
    }
  }
};