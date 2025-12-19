
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  limit
} from "firebase/firestore";
import { TeamRegistration, LiveChannel, Post, Comment } from "../types";

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
  getLiveChannels: async (): Promise<LiveChannel[]> => {
    try {
      const q = query(collection(db, "live_channels"), where("is_active", "==", true));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveChannel));
    } catch (error: any) {
      if (error.code === 'permission-denied') throw new Error("PERMISSION_DENIED");
      return [];
    }
  },

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
      return { error: error.code === 'permission-denied' ? "PERMISSION_DENIED" : error.message };
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
    } catch (error: any) {
      return { error: error.message };
    }
  },

  addToGallery: async (teamId: string, imageUrl: string) => {
    try {
      const teamRef = doc(db, "teams", teamId);
      await updateDoc(teamRef, {
        gallery: arrayUnion(imageUrl)
      });
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  createPost: async (postData: Omit<Post, 'id' | 'created_at'>) => {
    try {
      const postToSave = {
        ...postData,
        likes: [],
        comments: [],
        created_at: Timestamp.now()
      };
      const docRef = await addDoc(collection(db, "posts"), postToSave);
      return { id: docRef.id, ...postToSave };
    } catch (error: any) {
      throw error;
    }
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

  toggleLike: async (postId: string, teamId: string, isLiked: boolean) => {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(teamId) : arrayUnion(teamId)
      });
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  addComment: async (postId: string, comment: Comment) => {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        comments: arrayUnion(comment)
      });
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  }
};
