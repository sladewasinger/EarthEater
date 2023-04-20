// define-custom-element.ts
export function defineCustomElement<T extends HTMLElement>(
    tagName: string,
    component: { new(): T }
) {
    if (!customElements.get(tagName)) {
        customElements.define(tagName, component);
    }
}
