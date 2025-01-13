import * as Api from "./api.js";

if (localStorage.getItem("User")) {
    new Api.Storage("Users").GetDocumentsByField("Username", JSON.parse(localStorage.getItem("User")).Username).then((Users) => {
        if (Users.length > 0) {
            Api.LogInButton.innerHTML = "Account";
            Api.UsernameLabel.innerHTML = Users[0].Username;
            Api.TagLabel.innerHTML = `#${Users[0].Tag}`;
            Api.ProfileImage.src = Users[0].ProfileImage || "../images/Default.svg";
        } else Api.LogInButton.innerHTML = "Log In";
    });
}