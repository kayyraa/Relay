import * as Api from "./api.js";

const Form = document.querySelector(".AccountForm");
if (Form) {
	const UsernameInput = Form.querySelector(".UsernameInput");
	const PasswordInput = Form.querySelector(".PasswordInput");
	const SubmitButton = Form.querySelector(".SubmitButton");

	const Storage = new Api.Storage("Users");

	SubmitButton.addEventListener("click", async () => {
		const Username = UsernameInput.value;
		const Password = PasswordInput.value;
		if (!Username || !Password) return;

		async function GenerateUser() {
			const Tag = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
			const ExistingUsers = await Storage.GetDocumentsByField("Username", Username);

			if (ExistingUsers.length > 0) {
				const ExistingTaggedUsers = await Storage.GetDocumentsByField("Tag", Tag);
				if (ExistingTaggedUsers.length === 0) {
					if (ExistingUsers[0].Password === Password) {
						localStorage.setItem("User", JSON.stringify(ExistingUsers[0]));
						window.location.href = "../index.html";
					}
				} else await GenerateUser();
			} else {
				const TagUsers = await Storage.GetDocumentsByField("Tag", Tag);
				if (TagUsers.length > 0) {
					await GenerateUser();
				} else {
					const User = {
						Username: Username,
						Password: Password,
						Tag: Tag,
						ProfileImage: ""
					};

					await Storage.AppendDocument(User);
					localStorage.setItem("User", JSON.stringify(User));
					window.location.href = "../index.html";
				}
			}
		}

		await GenerateUser();
	});
}