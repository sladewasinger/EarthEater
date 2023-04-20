
import { CustomComponent } from '../whodoIthinkIam/CustomComponent';

// name must match folder name and html and csss file names
export class MainForm extends CustomComponent {
    public lobbyName: string = '';

    createLobby(e: Event) {
        e.preventDefault();
        console.log('Creating lobby...');
    }
}

