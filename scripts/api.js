import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import * as Firestore from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

window.CurrentChat = null;

if (!localStorage.getItem("LastChat")) localStorage.setItem("LastChat", "");

export const FirebaseConfig = {
    apiKey: "AIzaSyDXROfKnvyVpeTnzeFR3qCwqlOmJr8ZHDY",
    authDomain: "relay-f18d0.firebaseapp.com",
    projectId: "relay-f18d0",
    storageBucket: "relay-f18d0.firebasestorage.app",
    messagingSenderId: "674842319779",
    appId: "1:674842319779:web:74dc420a701aa8eb231816",
    measurementId: "G-XP05YRXPBL"
};

export const GithubStorageConfig = {
    Token: "",
    StorageOwner: "kayyraa",
    StorageName: "DirectStorage"
};

export const App = initializeApp(FirebaseConfig);
export const Analytics = getAnalytics(App);
export const Db = Firestore.getFirestore(App);

export const LogInButton = document.querySelector(".LogInButton");
export const NewChatButton = document.querySelector(".NewChatButton");

export const Chats = document.querySelector(".Chats");
export const Messages = document.querySelector(".Messages");
export const Logo = document.querySelector(".Logo");
export const UsernameLabel = document.querySelector(".UsernameLabel");
export const TagLabel = document.querySelector(".TagLabel");
export const ProfileImage = document.querySelector(".ProfileImage");

export const MessageInput = document.querySelector(".MessageInput");
export const NewChatInput = document.querySelector(".NewChatInput");

export class GithubStorage {
	constructor(Document) {
		this.File = Document || null;
	}

	async Upload(Path = "") {
		if (!this.File) throw new Error("No file provided for upload.");
		const FileContent = await this.ReadFileAsBase64(this.File);

		const Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/${GithubStorageConfig.StorageName}/contents/${Path}`;
		const Data = {
			message: "Upload file to repo",
			content: FileContent
		};

		const Response = await fetch(Url, {
			method: "PUT",
			headers: {
				"Authorization": `Bearer ${GithubStorageConfig.Token}`,
				"Accept": "application/vnd.github.v3+json"
			},
			body: JSON.stringify(Data)
		});

		const Result = await Response.json();
		if (Response.ok) {
			console.log("File uploaded:", Result.content.html_url);
		} else {
			console.error("Upload failed:", Result);
		}
	}

	async Download(Path) {
		const Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/${GithubStorageConfig.StorageName}/contents/${Path}`;

		const Response = await fetch(Url, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${GithubStorageConfig.Token}`,
				"Accept": "application/vnd.github.v3+json"
			}
		});

		if (Response.ok) {
			const Result = await Response.json();
			const FileContent = atob(Result.content); // Decode Base64 content
			const Blob = new Blob([FileContent], { type: "application/octet-stream" });
			return new File([Blob], Path.split("/").pop(), { type: Blob.type });
		} else {
			const ErrorData = await Response.json();
			console.error("Failed to fetch file:", ErrorData);
			throw new Error(ErrorData.message || "File fetch failed");
		}
	}

	async ReadFileAsBase64(File) {
		return new Promise((Resolve, Reject) => {
			const Reader = new FileReader();
			Reader.onload = () => Resolve(Reader.result.split(",")[1]);
			Reader.onerror = Reject;
			Reader.readAsDataURL(File);
		});
	}
}

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

export function Showcase(ImageUrl, VideoUrl, AudioUrl) {
    document.querySelectorAll("body *").forEach(Node => Node.style.filter = "blur(2px)");
    document.querySelectorAll("body .Media").forEach(Node => {
        Node.style.filter = "none";
        Node.style.display = "";
    });
    document.querySelectorAll("body .Media *").forEach(Node => Node.style.filter = "none");

    document.querySelector(".Media").querySelector(".CloseButton").addEventListener("click", () => {
        document.querySelectorAll("body *").forEach(Node => Node.style.filter = "");
        document.querySelectorAll("body .Media").forEach(Node => Node.style.display = "none");
    });

    if (ImageUrl) {
        document.querySelector(".Media").querySelector("img").src = ImageUrl;
        document.querySelector(".Media").querySelector("video").style.display = "none";
        document.querySelector(".Media").querySelector("audio").style.display = "none";
    } else if (VideoUrl) {
        const VideoElement = document.querySelector(".Media").querySelector("video");
        VideoElement.src = VideoUrl;
        VideoElement.play();
        document.querySelector(".Media").querySelector("img").style.display = "none";
        document.querySelector(".Media").querySelector("audio").style.display = "none";
    } else if (AudioUrl) {
        const AudioElement = document.querySelector(".Media").querySelector("audio");
        AudioElement.src = AudioUrl;
        AudioElement.play();
        document.querySelector(".Media").querySelector("img").style.display = "none";
        document.querySelector(".Media").querySelector("video").style.display = "none";
    }
}

Math.randint = (Max, Min) => {
    return Math.random() * (Max - Min + 1) + Min
};

await new Storage("Secrets").GetDocument("Token").then((Token) => GithubStorageConfig.Token = Token[0].Value);