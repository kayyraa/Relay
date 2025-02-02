import * as Api from "./api.js";

window.Api = Api;
const CurrentUser = JSON.parse(localStorage.getItem("User")).Username;

const Avatars = [];

function GenerateMessages(Chat) {
    Api.Messages.innerHTML = "";
    let LastUser;
    let LastTime = Math.floor(Date.now() / 1000);
    Chat.Messages.forEach(async Message => {
        let Avatar;
        const ExistingAvatar = Avatars.find(item => item[0] === Message.User);
        if (ExistingAvatar) Avatar = ExistingAvatar[1]; 
        else {
            Avatar = await new Api.Storage("Users").GetDocumentsByField("Username", Message.User).then((Document) => Document[0]?.ProfileImage);
            Avatars.push([Message.User, Avatar || '../images/Default.svg']);
        }

        if (LastUser !== Message.User || Math.abs(Message.Timestamp - LastTime) > 40) {
            const UserLabel = document.createElement("div");
            UserLabel.innerHTML = `<img src="${Avatar || '../images/Default.svg'}"><header>${Message.User}</header>`;
            UserLabel.style.order = Message.Timestamp;
            UserLabel.style.paddingTop = "8px";
            UserLabel.setAttribute("client", Message.User !== CurrentUser);
            Api.Messages.appendChild(UserLabel);
            LastTime = Message.Timestamp;
            LastUser = Message.User;
        }

        const MessagePart = document.createElement("div");
        MessagePart.innerHTML = `<span>${Message.Content}</span>`;
        MessagePart.style.order = Message.Timestamp;
        MessagePart.setAttribute("client", Message.User !== CurrentUser);
        Api.Messages.appendChild(MessagePart);

        MessagePart.querySelector("span").querySelectorAll("img").forEach(ImageNode => {
            const Class = String.characters[Math.floor(Math.random() * 9999)];
            ImageNode.classList.add(Class);

            ImageNode.addEventListener("click", () => {
                window.open(ImageNode.src);
            });
        });

        if (Message.User === CurrentUser) {
            const RemoveButton = document.createElement("img");
            RemoveButton.src = "../images/Remove.svg";
            RemoveButton.style.opacity = "0";
            RemoveButton.classList.add("OptionsButton");
            MessagePart.appendChild(RemoveButton);

            MessagePart.addEventListener("mouseenter", () => {
                RemoveButton.style.opacity = "1";
            });
            MessagePart.addEventListener("mouseleave", () => {
                RemoveButton.style.opacity = "0";
            });
            RemoveButton.addEventListener("click", async () => {
                let Messages = [];
                for (let Index = 0; Index < Chat.Messages.length; Index++) {
                    if (Chat.Messages[Index].Id !== Message.Id) {
                        Messages.push(Chat.Messages[Index]);
                    }
                }

                await new Api.Storage("Chats").UpdateDocument(Chat.id, { Messages: Messages });

                await new Api.Storage("Chats").GetDocument(Chat.id).then((Document) => {
                    if (!Document[0]) return;
                    Api.Messages.innerHTML = "";
                    GenerateMessages(Document[0]);
                });
            });
        }

        Api.Messages.scrollTo(0, Api.Messages.scrollHeight);
    });
}

async function GenerateChat(Chat) {
    if (!Chat.Users.includes(CurrentUser)) return;
    const ChatPart = document.createElement("div");
    Api.Chats.appendChild(ChatPart);

    let OtherUser;
    await new Api.Storage("Users").GetDocumentsByField("Username", Chat.Users.filter((User) => User !== CurrentUser).join(", ")).then((Document) => {
        if (!Document[0]) return;
        OtherUser = Document[0];
        ChatPart.innerHTML = ChatPart.innerHTML + `
            <img src="${Document[0].ProfileImage || "../images/Default.svg"}">
            <span>${Chat.Users.filter((User) => User !== CurrentUser).join(", ")}</span>
            <span style="opacity: 0;">#${Document[0].Tag}</span>
            <!--<img class="CallButton" src="../images/Call.svg">-->
        `;
    });

    ChatPart.addEventListener("mouseenter", () => {
        ChatPart.querySelectorAll("span")[1].style.opacity = 0.25;
    });
    ChatPart.addEventListener("mouseleave", () => {
        ChatPart.querySelectorAll("span")[1].style.opacity = 0;
    });
    
    ChatPart?.querySelector(".CallButton")?.addEventListener("click", async () => {
        return;
        const VoiceChat = new Api.VoiceChat([CurrentUser, Chat.Users.filter((Object) => Object !== CurrentUser)[0]]);
        
        await VoiceChat.Setup();
        //VoiceChat.ListenForVoiceChats();
        VoiceChat.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                signalingChannel.send({
                    type: 'candidate',
                    candidate: event.candidate
                });
            }
        };
    
        VoiceChat.peerConnection.ondatachannel = (event) => {
            // Handle data channel if needed
        };
    
        // Handle incoming offers or answers (you would need to have this as part of the signaling process)
        VoiceChat.signalingChannel.onmessage = (message) => {
            if (message.type === 'offer' && !VoiceChat.offerReceived) {
                VoiceChat.offerReceived = true;
                VoiceChat.peerConnection.setRemoteDescription(message.sdp)
                    .then(() => VoiceChat.peerConnection.createAnswer())
                    .then((answer) => VoiceChat.peerConnection.setLocalDescription(answer))
                    .then(() => {
                        VoiceChat.signalingChannel.send({
                            type: 'answer',
                            sdp: VoiceChat.peerConnection.localDescription
                        });
                    })
                    .catch((error) => {
                        console.error("Error in handling offer/answer:", error);
                    });
            } else if (message.type === 'answer') {
                VoiceChat.peerConnection.setRemoteDescription(message.sdp)
                    .catch((error) => {
                        console.error("Error in setting remote description:", error);
                    });
            }
        };
    });

    ChatPart.addEventListener("click", async () => {
        await new Api.Storage("Chats").GetDocument(Chat.id).then(async (Document) => {
            if (!Document[0]) return;
            GenerateMessages(Document[0]);
            Api.Messages.scrollTo(0, Api.Messages.scrollHeight);
        });
        Api.MessageInput.placeholder = `Chat with ${OtherUser.Username}#${OtherUser.Tag}`;
        
        window.CurrentChat = Chat.id;
        localStorage.setItem("LastChat", Chat.id);

        if (Chat.Messages.length === 0) {
            const MessagePart = document.createElement("div");
            MessagePart.innerHTML = "There are no messages. Start the conversation!";
            MessagePart.setAttribute("info", "true");
            Api.Messages.appendChild(MessagePart);
        } else if (Api.Messages.querySelector("div[info]")) Api.Messages.querySelector("div[info]").remove();
    });
}

if (localStorage.getItem("LastChat")) {
    await new Api.Storage("Chats").GetDocument(localStorage.getItem("LastChat")).then(async (Chat) => {
        if (!Chat || !Chat[0]) return;
        GenerateMessages(Chat[0]);
        window.CurrentChat = Chat[0].id;
        Api.Messages.scrollTo(0, Api.Messages.scrollHeight);

        const ChatDocument = await new Api.Storage("Chats").GetDocument(Chat[0].id);
        if (ChatDocument) {
            const OtherUsername = ChatDocument[0].Users.filter(User => User !== CurrentUser).join(", ");
            const OtherUserDocuments = await new Api.Storage("Users").GetDocumentsByField("Username", OtherUsername);
            if (OtherUserDocuments[0]) Api.MessageInput.placeholder = `Chat with ${OtherUserDocuments[0].Username}#${OtherUserDocuments[0].Tag}`;
        }
    });
}

new Api.Storage("Chats").GetDocuments().then((Chats) => {
    Chats.forEach(Chat => GenerateChat(Chat));
});

Api.MessageInput.addEventListener("keydown", async (Event) => {
    if (Event.key !== "Enter") return;
    if (!Api.MessageInput.value || !window.CurrentChat) return;
    const Message = Api.MessageInput.value;
    await new Api.Storage("Chats").GetDocument(window.CurrentChat).then(async (Document) => {
        if (!Document[0]) return;

        Document[0].Messages.push({
            User: CurrentUser,
            Content: Message,
            Id: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (Char) => {
                const Random = (Math.random() * 16) | 0;
                const Value = Char === "x" ? Random : (Random & 0x3) | 0x8;
                return Value.toString(16);
            }),
            Timestamp: Math.floor(new Date() / 1000)
        });

        await new Api.Storage("Chats").UpdateDocument(window.CurrentChat, Document[0]);

        GenerateMessages(Document[0]);

        if (Document[0].Messages.length === 0) {
            const MessagePart = document.createElement("div");
            MessagePart.innerHTML = "There are no messages";
            MessagePart.setAttribute("info", "true");
            Api.Messages.appendChild(MessagePart);
        } else if (Api.Messages.querySelector("div[info]")) Api.Messages.querySelector("div[info]").remove();

        Api.MessageInput.value = "";
    });
});

Api.MessageInput.addEventListener("keyup", (Event) => {
    if (Event.key === "Enter") {
        Api.MessageInput.value = "";
    }
});