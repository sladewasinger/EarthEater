import { CustomComponent } from '../whodoIthinkIam/CustomComponent';

export class CreateLobbyForm extends CustomComponent {
    createLobby(e: Event) {
        e.preventDefault();
        console.log('Creating lobby...');
        const event = new CustomEvent("createLobby");
        document.dispatchEvent(event);
    }
}

