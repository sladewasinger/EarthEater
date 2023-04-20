import { CustomComponent } from '../whodoIthinkIam/CustomComponent';

export class CreateLobbyForm extends CustomComponent {
    public lobbyName: string = '';

    createLobby(e: Event) {
        e.preventDefault();
        console.log('Creating lobby...');
    }
}

