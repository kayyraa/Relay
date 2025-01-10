import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import * as Firestore from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

window.CurrentChat = null;

export const FirebaseConfig = {
    apiKey: "AIzaSyDXROfKnvyVpeTnzeFR3qCwqlOmJr8ZHDY",
    authDomain: "relay-f18d0.firebaseapp.com",
    projectId: "relay-f18d0",
    storageBucket: "relay-f18d0.firebasestorage.app",
    messagingSenderId: "674842319779",
    appId: "1:674842319779:web:74dc420a701aa8eb231816",
    measurementId: "G-XP05YRXPBL"
};

export const App = initializeApp(FirebaseConfig);
export const Analytics = getAnalytics(App);
export const Db = Firestore.getFirestore(App);

export const LogInButton = document.querySelector(".LogInButton");
export const NewChatButton = document.querySelector(".NewChatButton");

export const Chats = document.querySelector(".Chats");
export const Messages = document.querySelector(".Messages");

export const MessageInput = document.querySelector(".MessageInput");
export const NewChatInput = document.querySelector(".NewChatInput");

export class Storage {
    constructor(Collection = "") {
        this.Collection = Collection;
    }

    async AppendDocument(DocumentData) {
        if (!this.Collection) return;
        const DocRef = await Firestore.addDoc(Firestore.collection(Db, this.Collection), DocumentData);
        return DocRef.id;
    }

    async GetDocument(DocumentId) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        const Snapshot = await Firestore.getDoc(DocRef);
    
        if (Snapshot.exists()) {
            const data = Snapshot.data();
            return [{ id: Snapshot.id, ...data }];
        } else return null;
    }    

    async UpdateDocument(DocumentId, DocumentData) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        await Firestore.updateDoc(DocRef, DocumentData);
    }

    async DeleteDocument(DocumentId) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        await Firestore.deleteDoc(DocRef);
    }

    async GetDocuments(Query = {}) {
        if (!this.Collection) return;
        const CollectionRef = Firestore.collection(Db, this.Collection);
        let QueryRef = CollectionRef;
        Object.entries(Query).forEach(([Key, Value]) => {
            QueryRef = Firestore.query(QueryRef, Firestore.where(Key, "==", Value));
        });
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async GetDocumentsByField(FieldName, FieldValue) {
        if (!this.Collection) return;
        const QueryRef = Firestore.query(
            Firestore.collection(Db, this.Collection),
            Firestore.where(FieldName, "==", FieldValue)
        );
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async GetDocumentByFieldIncludes(FieldName, FieldValue) {
        if (!this.Collection) return;
        const QueryRef = Firestore.query(
            Firestore.collection(Db, this.Collection),
            Firestore.where(FieldName, ">=", FieldValue)
        );
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
}

Math.randint = (Max, Min) => {
    return Math.random() * (Max - Min + 1) + Min
};