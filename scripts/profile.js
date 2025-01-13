import * as Api from "./api.js";

const ProfileImageInput = document.querySelector(".ProfileImageInput");
const ProfileImage = document.querySelector(".ProfileImage");
const SaveTagButton = document.querySelector(".SaveTagButton");
const TagInput = document.querySelector(".TagInput");
const CurrentTagLabel = document.querySelector(".CurrentTagLabel");

const User = JSON.parse(localStorage.getItem("User"));
if (User) {
	const Document = await new Api.Storage("Users").GetDocumentsByField("Username", User.Username);
	if (Document[0] && Document[0].ProfileImage) {
		try {
			const File = await new Api.GithubStorage().Download(`relay/${Document[0].ProfileImage}`);
			const BlobUrl = URL.createObjectURL(File);
			User.ProfileImage = BlobUrl;
			ProfileImage.src = BlobUrl;
		} catch {
			ProfileImage.src = Document[0].ProfileImage;
		}
	} else {
		ProfileImage.src = "../images/Default.svg";
	}
}

ProfileImageInput.addEventListener("change", async () => {
    const File = ProfileImageInput.files[0];
    if (!File) return;

    const Reader = new FileReader();
    Reader.onload = async () => {
        const Base64Content = Reader.result.split(",")[1];
        const FileName = File.name;

        const BlobContent = new Blob([new Uint8Array(atob(Base64Content).split("").map(char => char.charCodeAt(0)))], { type: File.type });
        const FileFromBlob = new Blob([BlobContent], { type: File.type });

        const Storage = new Api.GithubStorage(FileFromBlob);
        
        const Uuid = `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (Char) => {
            const Random = (Math.random() * 16) | 0;
            const Value = Char === "x" ? Random : (Random & 0x3) | 0x8;
            return Value.toString(16);
        });

        const EncodedFileName = `${Uuid}-${FileName}`;

        await Storage.Upload(`relay/${EncodedFileName}`);

        const ImageUrl = `https://raw.githubusercontent.com/${Api.GithubStorageConfig.StorageOwner}/${Api.GithubStorageConfig.StorageName}/main/relay/${EncodedFileName}`;

        const Document = await new Api.Storage("Users").GetDocumentsByField("Username", User.Username);
        if (!Document[0]) return;

        await new Api.Storage("Users").UpdateDocument(Document[0].id, {
            ProfileImage: ImageUrl
        });

        ProfileImage.src = ImageUrl;
    };

    Reader.readAsDataURL(File);
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