import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getPerformance } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-performance.js";
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
export const Db = Firestore.getFirestore(App)
export const Performance = getPerformance(App);

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

class Storage {
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

    OnSnapshot(callback) {
        if (!this.Collection) return;
        const CollectionRef = Firestore.collection(Db, this.Collection);
        Firestore.onSnapshot(CollectionRef, (snapshot) => {
            callback(snapshot);
        });
    }
}

Math.randint = (Max, Min) => {
    return Math.random() * (Max - Min + 1) + Min
};

String.characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

await new Storage("Secrets").GetDocument("Token").then((Token) => GithubStorageConfig.Token = Token[0].Value);

export class VoiceChat {
    constructor(Users = [""], Uuid = "") {
        this.Users = Users || [];
        this.Uuid = Uuid || "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (Char) => {
            const Random = (Math.random() * 16) | 0;
            const Value = Char === "x" ? Random : (Random & 0x3) | 0x8;
            return Value.toString(16);
        });
        this.Peer = null;
        this.LocalStream = null;
    }

    ListenForVoiceChats() {
        const VoiceChatStorage = new Storage("VoiceChat");
        VoiceChatStorage.OnSnapshot((Snapshot) => {
            Snapshot.forEach((Document) => {
                const Data = Document.data();
                if (Data.Users && Data.Users.includes(JSON.parse(localStorage.getItem("User")).Username)) {
                    this.ListenToOtherUserStream(Document.id);
                }
            });
        });
    }

    ListenToOtherUserStream(VoiceChatId) {
        const VoiceChatStorage = new Storage("VoiceChat");

        VoiceChatStorage.GetDocument(VoiceChatId).then((Document) => {
            if (Document && Document[0] && Document[0].Data) {
                const Offer = Document[0].Data.find((Data) => Data.type === "offer");
                if (Offer) this.Peer.signal(Offer);
            }
        });
    }

    async Setup() {
        let VoiceChatDocument;
        const VoiceChatStorage = new Storage("VoiceChat");

        await VoiceChatStorage.AppendDocument({
            Users: this.Users,
            Data: [],
            Uuid: this.Uuid,
            Timestamp: Math.floor(Date.now() / 1000)
        });

        await VoiceChatStorage.GetDocumentsByField("Uuid", this.Uuid).then((Document) => {
            if (!Document || !Document[0]) return;
            VoiceChatDocument = Document[0];
        });

        this.Peer = new SimplePeer({
            initiator: true,
            trickle: false
        });

        this.Peer.on("signal", async (Data) => {
            const CurrentData = await VoiceChatStorage.GetDocument(VoiceChatDocument.id).then((Document) => {
                if (!Document || !Document[0]) return [];
                VoiceChatDocument = Document[0];
                return Document[0].Data;
            });

            CurrentData.push(Data);
            await VoiceChatStorage.UpdateDocument(VoiceChatDocument.id, { Data: CurrentData });

            console.log("SIGNAL", Data);
        });

        this.Peer.on("stream", (Stream) => {
            const Audio = document.createElement("audio");
            Audio.srcObject = Stream;
            Audio.play();
        });

        navigator.mediaDevices.getUserMedia({ audio: true }).then((Stream) => {
            this.LocalStream = Stream;
            this.Peer.addStream(Stream);

            const LocalAudio = document.createElement("audio");
            LocalAudio.srcObject = Stream;
            LocalAudio.play();
        }).catch((Error) => {
            console.error("Error getting user media", Error);
        });

        this.Peer.on("data", (data) => {
            console.log("Received Data:", data);
        });
    }

    async Disconnect() {
        const VoiceChatStorage = new Storage("VoiceChat");
        await VoiceChatStorage.GetDocumentsByField("Uuid", this.Uuid).then(async (Document) => {
            if (!Document || !Document[0]) return;
            await VoiceChatStorage.DeleteDocument(Document[0].id);
        });

        if (this.Peer) this.Peer.destroy();
        if (this.LocalStream) this.LocalStream.getTracks().forEach(Track => Track.stop());

        this.Peer = null;
        this.LocalStream = null;

        console.log("Disconnected", this.Uuid);
    }

    async Clear() {
        const VoiceChatStorage = new Storage("VoiceChat");
        VoiceChatStorage.GetDocuments().then((Documents) => {
            Documents.forEach(async (Document) => {
                await VoiceChatStorage.DeleteDocument(Document.id);
            });
        });
    }
}

const Test = new VoiceChat(["kayra", "Tahta"]);
//Test.Setup();
setTimeout(() => {
    //Test.Disconnect();
}, 5000);