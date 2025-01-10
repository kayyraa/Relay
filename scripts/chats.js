import * as Api from "./api.js";

const CurrentUser = JSON.parse(localStorage.getItem("User")).Username;

new Api.Storage("Chats").GetDocuments().then((Chats) => {
    Chats.forEach(Chat => {
        const ChatPart = document.createElement("div");
        ChatPart.innerHTML = `${Chat.Users.filter((User) => User !== CurrentUser).join(", ")}`;
        Api.Chats.appendChild(ChatPart);

        ChatPart.addEventListener("click", () => {
            Api.Messages.innerHTML = "";
            Chat.Messages.forEach(Message => {
                const MessagePart = document.createElement("div");
                MessagePart.innerHTML = Message.Content;
                MessagePart.setAttribute("client", Message.User !== CurrentUser);
                Api.Messages.appendChild(MessagePart);
            });
            window.CurrentChat = Chat.id;

            if (Chat.Messages.length === 0) {
                const MessagePart = document.createElement("div");
                MessagePart.innerHTML = "There are no messages";
                MessagePart.setAttribute("info", "true");
                Api.Messages.appendChild(MessagePart);
            } else Api.Messages.querySelector("div[info]").remove();
        });
    });
});

Api.MessageInput.addEventListener("keydown", async (Event) => {
    if (Event.key !== "Enter" || !Api.MessageInput.value || !window.CurrentChat) return;
    await new Api.Storage("Chats").GetDocument(window.CurrentChat).then(async (Document) => {
        console.log(Array.from(Document)[0]);
        if (!Document[0]) return;

        Document[0].Messages.push({
            User: CurrentUser,
            Content: Api.MessageInput.value
        });

        await new Api.Storage("Chats").UpdateDocument(window.CurrentChat, Document[0]);

        Api.Messages.innerHTML = "";
        Document[0].Messages.forEach(Message => {
            const MessagePart = document.createElement("div");
            MessagePart.innerHTML = Message.Content;
            MessagePart.setAttribute("client", Message.User !== CurrentUser);
            Api.Messages.appendChild(MessagePart);
        });

        if (Chat.Messages.length === 0) {
            const MessagePart = document.createElement("div");
            MessagePart.innerHTML = "There are no messages";
            MessagePart.setAttribute("info", "true");
            Api.Messages.appendChild(MessagePart);
        } else Api.Messages.querySelector("div[info]").remove();

        Api.MessageInput.value = "";
    });
});

Api.NewChatButton.addEventListener("click", async () => {
    if (!Api.NewChatInput.value) return;
    await new Api.Storage("Chats").AppendDocument({
        Messages: [],
        Users: [CurrentUser, Api.NewChatInput.value]
    });
    location.reload();
});