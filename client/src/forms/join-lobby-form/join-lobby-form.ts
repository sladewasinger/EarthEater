import { CustomComponent } from "../whodoIthinkIam/CustomComponent";

export class JoinLobbyForm extends CustomComponent {
    public lobbyName: string = '';

    joinLobby(e: Event) {
        e.preventDefault();
        console.log('Joining lobby...');
    }
}