export class CustomComponent extends HTMLElement {
    static registeredElements = new Set();

    constructor(html: string, css: string) {
        super();

        this.attachShadow({ mode: 'open' });
        if (!this.shadowRoot)
            throw new Error('Shadow root not found');

        if (!this.shadowRoot)
            throw new Error('Shadow root not found');

        const template = document.createElement('template');
        template.innerHTML = html;

        const style = document.createElement('style');
        style.textContent = css;
        template.content.appendChild(style);

        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this.bindInputElements();
        this.bindClickHandlers();
        this.bindSubmitHandlers();
    }

    bindInputElements() {
        if (!this.shadowRoot)
            throw new Error('Shadow root not found');

        const boundElements = this.shadowRoot.querySelectorAll<HTMLInputElement>('[\\[value\\]]');

        boundElements.forEach((element) => {
            const propertyName = element.getAttribute('[value]');
            const me = this as any;

            if (propertyName) {
                // Update class property when input value changes
                element.addEventListener('input', (event) => {
                    if (event.target && 'value' in event.target && typeof event.target.value === 'string') {
                        me[propertyName] = event.target.value;
                    }
                });

                // Set the input value when class property changes
                Object.defineProperty(this, propertyName, {
                    get() {
                        return me[`_${propertyName}`];
                    },
                    set(value: string) {
                        me[`_${propertyName}`] = value;
                        element.value = value;
                    },
                });

                // Initialize property with input value
                me[propertyName] = element.value;
            }
        });
    }

    bindClickHandlers() {
        if (!this.shadowRoot) throw new Error('Shadow root not found');

        const clickElements = this.shadowRoot.querySelectorAll('[\\[click\\]]');
        const me = this as any;

        clickElements.forEach((element) => {
            const methodName = element.getAttribute('[click]');

            if (methodName && typeof me[methodName] === 'function') {
                element.addEventListener('click', (event) => {
                    me[methodName](event);
                });
            }
        });
    }

    bindSubmitHandlers() {
        if (!this.shadowRoot) throw new Error('Shadow root not found');

        const formElements = this.shadowRoot.querySelectorAll('form');
        const me = this as any;

        formElements.forEach((element) => {
            const methodName = element.getAttribute('[submit]');

            if (methodName && typeof me[methodName] === 'function') {
                element.addEventListener('submit', (event) => {
                    me[methodName](event);
                    return false;
                });
            }
        });
    }
}
