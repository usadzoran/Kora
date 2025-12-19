
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  Timestamp,
  updateDoc,
  doc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  limit,
  setDoc,
  increment
} from "firebase/firestore";
import { TeamRegistration, LiveChannel, Post, Comment, AdConfig, Match } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyAKnoCa3sKwZrQaUXy0PNkJ1FbsJGAOyjk",
  authDomain: "studio-3236344976-c8013.firebaseapp.com",
  databaseURL: "https://studio-3236344976-c8013-default-rtdb.firebaseio.com",
  projectId: "studio-3236344976-c8013",
  storageBucket: "studio-3236344976-c8013.firebasestorage.app",
  messagingSenderId: "689062563273",
  appId: "1:689062563273:web:32d10b4c3b24a62a81ac18"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const FirebaseService = {
  // Stats
  trackVisit: async () => {
    try {
      const docRef = doc(db, "settings", "stats");
      await setDoc(docRef, { total_visits: increment(1) }, { merge: true });
    } catch (e) {}
  },

  getStats: async () => {
    try {
      const docSnap = await getDoc(doc(db, "settings", "stats"));
      return docSnap.exists() ? docSnap.data().total_visits : 0;
    } catch (e) { return 0; }
  },

  // Matches Management
  getMatches: async (): Promise<Match[]> => {
    try {
      const q = query(collection(db, "matches"), orderBy("date", "asc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
    } catch (error) { return []; }
  },

  createMatch: async (match: Omit<Match, 'id' | 'created_at'>) => {
    try {
      await addDoc(collection(db, "matches"), { ...match, created_at: Timestamp.now() });
      return { success: true };
    } catch (e: any) { return { error: e.message }; }
  },

  updateMatch: async (id: string, data: Partial<Match>) => {
    try {
      await updateDoc(doc(db, "matches", id), data);
      return { success: true };
    } catch (e: any) { return { error: e.message }; }
  },

  deleteMatch: async (id: string) => {
    try {
      await deleteDoc(doc(db, "matches", id));
      return { success: true };
    } catch (e: any) { return { error: e.message }; }
  },

  // Ads Management
  getAds: async (): Promise<AdConfig> => {
    try {
      const docRef = doc(db, "settings", "ads");
      const docSnap = await getDoc(docRef);
      const defaultAds: AdConfig = { 
        under_header: "", 
        home_hero_bottom: "",
        after_draw: "", 
        hub_top: "", 
        hub_bottom: "", 
        matches_top: "",
        matches_bottom: "",
        live_top: "",
        profile_top: ""
      };
      if (docSnap.exists()) {
        return { ...defaultAds, ...docSnap.data() } as AdConfig;
      }
      return defaultAds;
    } catch (error) {
      return { 
        under_header: "", 
        home_hero_bottom: "",
        after_draw: "", 
        hub_top: "", 
        hub_bottom: "", 
        matches_top: "",
        matches_bottom: "",
        live_top: "",
        profile_top: ""
      };
    }
  },

  updateAds: async (ads: AdConfig) => {
    try {
      const docRef = doc(db, "settings", "ads");
      await setDoc(docRef, ads);
      return { success: true };
    } catch (error: any) { return { error: error.message }; }
  },

  // Live Channels Management
  getLiveChannels: async (all = false): Promise<LiveChannel[]> => {
    try {
      const constraints = all ? [] : [where("is_active", "==", true)];
      const q = query(collection(db, "live_channels"), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveChannel));
    } catch (error: any) {
      if (error.code === 'permission-denied') throw new Error("PERMISSION_DENIED");
      return [];
    }
  },

  createLiveChannel: async (data: LiveChannel) => {
    try {
      await addDoc(collection(db, "live_channels"), { ...data, created_at: Timestamp.now() });
      return { success: true };
    } catch (error: any) { return { error: error.message }; }
  },

  updateLiveChannel: async (id: string, data: Partial<LiveChannel>) => {
    try {
      await updateDoc(doc(db, "live_channels", id), data);
      return { success: true };
    } catch (error: any) { return { error: error.message }; }
  },

  deleteLiveChannel: async (id: string) => {
    try {
      await deleteDoc(doc(db, "live_channels", id));
      return { success: true };
    } catch (error: any) { return { error: error.message }; }
  },

  // Teams Management
  getAllTeams: async (): Promise<TeamRegistration[]> => {
    try {
      const q = query(collection(db, "teams"), orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamRegistration));
    } catch (error: any) {
      if (error.code === 'permission-denied') throw new Error("PERMISSION_DENIED");
      return [];
    }
  },

  getTeamById: async (id: string): Promise<TeamRegistration | null> => {
    try {
      const docRef = doc(db, "teams", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as TeamRegistration;
      }
      return null;
    } catch (error) { return null; }
  },

  registerTeam: async (teamData: Omit<TeamRegistration, 'id' | 'created_at'>) => {
    try {
      const teamToSave = {
        ...teamData,
        logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(teamData.team_name)}&background=2563eb&color=fff&size=200`,
        wins: 0,
        losses: 0,
        players_count: 0,
        municipality: teamData.region,
        bio: "فريق رياضي طموح.",
        gallery: [],
        created_at: Timestamp.now()
      };
      const docRef = await addDoc(collection(db, "teams"), teamToSave);
      return { id: docRef.id, ...teamToSave, error: null };
    } catch (error: any) {
      // Added id: undefined to satisfy TypeScript union types when consuming code checks for id
      return { id: undefined, error: error.code === 'permission-denied' ? "PERMISSION_DENIED" : error.message };
    }
  },

  loginTeam: async (email: string, password?: string) => {
    try {
      const q = query(collection(db, "teams"), where("contact_email", "==", email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) throw new Error("الحساب غير موجود.");
      const team = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as TeamRegistration;
      if (password && team.password !== password) throw new Error("كلمة المرور غير صحيحة.");
      return { data: team, error: null };
    } catch (error: any) {
      return { data: null, error: error.code === 'permission-denied' ? "PERMISSION_DENIED" : error.message };
    }
  },

  updateTeamProfile: async (teamId: string, data: Partial<TeamRegistration>) => {
    try {
      const teamRef = doc(db, "teams", teamId);
      await updateDoc(teamRef, data);
      return { success: true };
    } catch (error: any) { return { error: error.message }; }
  },

  deleteTeam: async (id: string) => {
    try {
      await deleteDoc(doc(db, "teams", id));
      return { success: true };
    } catch (error: any) { return { error: error.message }; }
  },

  addToGallery: async (teamId: string, imageUrl: string) => {
    try {
      const teamRef = doc(db, "teams", teamId);
      await updateDoc(teamRef, { gallery: arrayUnion(imageUrl) });
      return { success: true };
    } catch (error: any) { return { error: error.message }; }
  },

  // Posts Management
  createPost: async (postData: Omit<Post, 'id' | 'created_at'>) => {
    try {
      const postToSave = { ...postData, likes: [], comments: [], created_at: Timestamp.now() };
      const docRef = await addDoc(collection(db, "posts"), postToSave);
      return { id: docRef.id, ...postToSave };
    } catch (error: any) { throw error; }
  },

  getPosts: async (): Promise<Post[]> => {
    try {
      const q = query(collection(db, "posts"), orderBy("created_at", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    } catch (error: any) {
      if (error.code === 'permission-denied') throw new Error("PERMISSION_DENIED");
      return [];
    }
  },

  deletePost: async (postId: string) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
      return { success: true };
    } catch (error: any) { return { error: error.message }; }
  },

  toggleLike: async (postId: string, teamId: string, isLiked: boolean) => {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { likes: isLiked ? arrayRemove(teamId) : arrayUnion(teamId) });
      return { success: true };
    } catch (error: any) { return { error: error.message }; }
  },

  addComment: async (postId: string, comment: Comment) => {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { comments: arrayUnion(comment) });
      return { success: true };
    } catch (error: any) { return { error: error.message }; }
  }
};
