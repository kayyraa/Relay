import * as Api from "./api.js";

const ProfileImageInput = document.querySelector(".ProfileImageInput");
const ProfileImage = document.querySelector(".ProfileImage");

const SaveTagButton = document.querySelector(".SaveTagButton");
const TagInput = document.querySelector(".TagInput");
const CurrentTagLabel = document.querySelector(".CurrentTagLabel");

const User = JSON.parse(localStorage.getItem("User"));
if (User) {
    const Document = await new Api.Storage("Users").GetDocumentsByField("Username", User.Username);
    if (Document[0]) {
        ProfileImage.src = Document[0].ProfileImage ? Document[0].ProfileImage : "../images/Default.svg";
        CurrentTagLabel.innerHTML = `#${Document[0].Tag}`;
    }
}

async function SetProfileImage(ImageUrl) {
    const User = JSON.parse(localStorage.getItem("User"));
    if (!User) return;

    const Document = await new Api.Storage("Users").GetDocumentsByField("Username", User.Username);
    if (!Document[0]) return;

    await new Api.Storage("Users").UpdateDocument(Document[0].id, {
        ProfileImage: ImageUrl
    });

    ProfileImage.src = ImageUrl;
}

ProfileImageInput.addEventListener("change", async () => {
    const File = ProfileImageInput.files[0];
    if (!File) return;

    await new Api.GithubStorage(File).Upload(`relay/${File.name}`);
    const Response = await fetch(`https://api.github.com/repos/${Api.GithubStorageConfig.StorageOwner}/${Api.GithubStorageConfig.StorageName}/contents/relay/${File.name}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${Api.GithubStorageConfig.Token}`,
            "Accept": "application/vnd.github.v3+json"
        }
    });

    const Result = await Response.json();
    if (Response.ok) {
        const ImageUrl = Result.content ? `data:image/png;base64,${Result.content}` : null;
        if (ImageUrl) SetProfileImage(ImageUrl);
    }

    location.reload();
});

SaveTagButton.addEventListener("click", async () => {
    if (!TagInput.value) return;

    const Document = await new Api.Storage("Users").GetDocumentsByField("Username", User.Username);
    if (!Document[0]) return;
    
    await new Api.Storage("Users").UpdateDocument(Document[0].id, {
        Tag: String(parseInt(TagInput.value)).padStart(4, "0")
    });
    location.reload();
});