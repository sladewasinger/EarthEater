import { CreateLobbyForm } from "./create-lobby-form/create-lobby-form";
import { JoinLobbyForm } from "./join-lobby-form/join-lobby-form";
import { MainForm } from "./main-form/main-form";
import { defineCustomElement } from "./whodoIthinkIam/define-custom-element";

export function loadCustomComponents() {
    defineCustomElement('create-lobby-form', CreateLobbyForm);
    defineCustomElement('join-lobby-form', JoinLobbyForm);
    defineCustomElement('main-form', MainForm);
}