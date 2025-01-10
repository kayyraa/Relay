import * as Api from "./api.js";

if (localStorage.getItem("User")) {
    new Api.Storage("Users").GetDocumentsByField("Username", JSON.parse(localStorage.getItem("User")).Username).then((Users) => {
        if (Users.length > 0) {
            Api.LogInButton.innerHTML = `${Users[0].Username}#${Users[0].Tag}`;
            Api.LogInButton.removeAttribute("button");
        } else Api.LogInButton.innerHTML = "Log In";
    });
}