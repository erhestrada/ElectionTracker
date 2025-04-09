import { retrieveData } from "./retrieveData";

function setupApiButton() {
    const apiButton = document.getElementById('api-button');

    apiButton.addEventListener('click', async () => {
        const data = await retrieveData();
        console.log(data);
    });
}

setupApiButton();