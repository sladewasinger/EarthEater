import { CustomComponent } from '../whodoIthinkIam/CustomComponent';
import html from './main-form.html?raw';
import css from './main-form.css?raw';

// name must match folder name and html and csss file names
export class MainForm extends CustomComponent {
    constructor() {
        super(html, css);
    }
}

