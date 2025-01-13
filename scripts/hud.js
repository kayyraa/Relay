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

const Container = document.querySelector(".Cover");

const InitialSpeed = 0.75;
const DeadArea = 2;
const PulseRate = 5;
let Iteration = 0;

const CheckVisibility = () => {
    if (window.DevMode || Iteration / 100 > 225 * (InitialSpeed > 1 ? InitialSpeed : 1 + InitialSpeed)) Container.remove();
};

for (let Index = 0; Index < 10; Index++) {
    const DivContainer = document.createElement("div");
    for (let InnerIndex = 0; InnerIndex < 10; InnerIndex++) {
        const Div = document.createElement("div");
        DivContainer.appendChild(Div);

        let Opacity = 0;
        let Factor = 1;
        const Speed = (InnerIndex + 10) / (Index + 5) * InitialSpeed;

        const Loop = () => {
            Iteration++;

            Opacity += 0.025 * Speed * Factor;
            Div.style.opacity = Opacity;

            if (Opacity >= DeadArea) Factor = -1;
            else if (Opacity < 0) Factor += Math.abs(Math.pow(10, -PulseRate));

            CheckVisibility();
            requestAnimationFrame(Loop);
        };

        Loop();
    }
    Container.appendChild(DivContainer);
}