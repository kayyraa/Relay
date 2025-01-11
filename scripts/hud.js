import * as Api from "./api.js";

if (localStorage.getItem("User")) {
    new Api.Storage("Users").GetDocumentsByField("Username", JSON.parse(localStorage.getItem("User")).Username).then((Users) => {
        if (Users.length > 0) {
            Api.LogInButton.innerHTML = `${Users[0].Username}#${Users[0].Tag}`;
            Api.LogInButton.removeAttribute("button");
        } else Api.LogInButton.innerHTML = "Log In";
    });
}

const originalFetch = window.fetch;
const activeRequests = new Set();

window.fetch = async (...args) => {
    const Promise = originalFetch(...args);
    activeRequests.add(Promise);
    Promise.finally(() => activeRequests.delete(Promise));
    return Promise;
};

window.addEventListener("load", () => {
    const CheckDynamicRequests = setInterval(() => {
        if (activeRequests.size === 0) {
            setTimeout(() => {
                Api.Cover.style.opacity = 0;
                setTimeout(() => {
                    Api.Cover.remove();
                }, window.DevMode ? 0 : 250);
            }, window.DevMode ? 0 : 750);
            clearInterval(CheckDynamicRequests);
        }
    }, window.DevMode ? 100 : 250);
});