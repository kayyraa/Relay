import * as Api from "./api.js";

window.Api = Api;
const CurrentUser = JSON.parse(localStorage.getItem("User")).Username;

function GenerateMessages(Chat) {
    Api.Messages.innerHTML = "";
    let LastUser;
    let LastTime = Math.floor(Date.now() / 1000);
    Chat.Messages.forEach(async Message => {
        const Avatar = await new Api.Storage("Users").GetDocumentsByField("Username", Message.User).then((Document) => Document[0]?.ProfileImage);

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
                    GenerateMessages(Document[0]);
                });
            });
        }
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
            <img class="CallButton" src="../images/Call.svg">
        `;
    });

    ChatPart.addEventListener("mouseenter", () => {
        ChatPart.querySelectorAll("span")[1].style.opacity = 0.25;
    });
    ChatPart.addEventListener("mouseleave", () => {
        ChatPart.querySelectorAll("span")[1].style.opacity = 0;
    });
    
    ChatPart.querySelector(".CallButton").addEventListener("click", async () => {
        const VoiceChat = new Api.VoiceChat([
            JSON.parse(localStorage.getItem("User")).Username,
            Chat.Users.filter((Object) => Object !== JSON.parse(localStorage.getItem("User")).Username)[0]
        ]);
        await VoiceChat.Setup();
    });

    ChatPart.addEventListener("click", async () => {
        await new Api.Storage("Chats").GetDocument(Chat.id).then((Document) => {
            if (!Document[0]) return;
            GenerateMessages(Document[0]);
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

        const ChatDocument = await new Api.Storage("Chats").GetDocument(Chat[0].id);
        if (ChatDocument) {
            const OtherUsername = ChatDocument[0].Users.filter(User => User !== CurrentUser).join(", ");
            const OtherUserDocuments = await new Api.Storage("Users").GetDocumentsByField("Username", OtherUsername);

            if (OtherUserDocuments[0]) {
                Api.MessageInput.placeholder = `Chat with ${OtherUserDocuments[0].Username}#${OtherUserDocuments[0].Tag}`;
            }
        }
    });
}

new Api.Storage("Chats").GetDocuments().then((Chats) => {
    Chats.forEach(Chat => GenerateChat(Chat));
});

Api.MessageInput.addEventListener("keydown", async (Event) => {
    if (Event.key !== "Enter" || !Api.MessageInput.value || !window.CurrentChat) return;
    await new Api.Storage("Chats").GetDocument(window.CurrentChat).then(async (Document) => {
        if (!Document[0]) return;

        Document[0].Messages.push({
            User: CurrentUser,
            Content: Api.MessageInput.value,
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

Api.NewChatButton.addEventListener("click", async () => {
    if (!Api.NewChatInput.value) return;
    await new Api.Storage("Users").GetDocumentsByField("Username", Api.NewChatInput.value).then(async (Document) => {
        if (!Document[0]) return;
        await new Api.Storage("Chats").AppendDocument({
            Messages: [],
            Users: [CurrentUser, Document[0].Username]
        });
        location.reload();
    });
});