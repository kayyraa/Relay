import * as Api from "./api.js";

const CurrentUser = JSON.parse(localStorage.getItem("User")).Username;

function GenerateMessages(Chat) {
    Api.Messages.innerHTML = "";
    Chat.Messages.forEach(Message => {
        const MessagePart = document.createElement("div");
        MessagePart.innerHTML = Message.Content;
        MessagePart.setAttribute("client", Message.User !== CurrentUser);
        Api.Messages.appendChild(MessagePart);

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
            await new Api.Storage("Chats").UpdateDocument(Chat.id, {
                Messages: Chat.Messages.filter((Message) => Message.id !== Message.id)
            });

            await new Api.Storage("Chats").GetDocument(Chat.id).then((Document) => {
                if (!Document[0]) return;
                GenerateMessages(Document[0]);
            });
        });
    });
}

function GenerateChat(Chat) {
    if (!Chat.Users.includes(CurrentUser)) return;
    const ChatPart = document.createElement("div");
    ChatPart.innerHTML = `${Chat.Users.filter((User) => User !== CurrentUser).join(", ")}`;
    Api.Chats.appendChild(ChatPart);

    ChatPart.addEventListener("click", async () => {
        await new Api.Storage("Chats").GetDocument(Chat.id).then((Document) => {
            if (!Document[0]) return;
            GenerateMessages(Document[0]);
        });
        window.CurrentChat = Chat.id;
        localStorage.setItem("LastChat", Chat.id);

        await new Api.Storage("Users").GetDocumentsByField("Username", Chat.Users.filter((User) => User !== CurrentUser).join(", ")).then((Document) => {
            if (!Document[0]) return;
            Api.MessageInput.placeholder = `Message to ${Chat.Users.filter((User) => User !== CurrentUser).join(", ")}#${Document[0].Tag}`;
        });

        if (Chat.Messages.length === 0) {
            const MessagePart = document.createElement("div");
            MessagePart.innerHTML = "There are no messages";
            MessagePart.setAttribute("info", "true");
            Api.Messages.appendChild(MessagePart);
        } else if (Api.Messages.querySelector("div[info]")) Api.Messages.querySelector("div[info]").remove();
    });
}

if (localStorage.getItem("LastChat")) {
    new Api.Storage("Chats").GetDocument(localStorage.getItem("LastChat")).then((Chat) => {
        if (!Chat[0]) return;
        GenerateMessages(Chat[0]);
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
	        })
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