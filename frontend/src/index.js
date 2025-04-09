import { retrieveData } from "./retrieveData";

function setupApiButton() {
    const apiButton = document.getElementById('api-button');

    apiButton.addEventListener('click', () => {
        const data = retrieveData();
        console.log(data);
    });
}

setupApiButton();