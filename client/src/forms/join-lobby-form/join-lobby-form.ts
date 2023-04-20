import { CustomComponent } from "../whodoIthinkIam/CustomComponent";
import html from "./join-lobby-form.html?raw";
import css from "./join-lobby-form.css?raw";

export class JoinLobbyForm extends CustomComponent {
    public lobbyName: string = '';

    constructor() {
        super(html, css);
    }

    joinLobby(e: Event) {
        e.preventDefault();
        console.log('Joining lobby...');
        const event = new CustomEvent("joinLobby", {
            detail: this.lobbyName,
        });
        document.dispatchEvent(event);
    }
}