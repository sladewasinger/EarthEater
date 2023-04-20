import { CustomComponent } from '../whodoIthinkIam/CustomComponent';
import html from './create-lobby-form.html?raw';
import css from './create-lobby-form.css?raw';

export class CreateLobbyForm extends CustomComponent {
    constructor() {
        super(html, css);
    }

    createLobby(e: Event) {
        e.preventDefault();
        console.log('Creating lobby...');
        const event = new CustomEvent("createLobby");
        document.dispatchEvent(event);
    }
}

