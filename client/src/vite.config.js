import { defineConfig } from 'vite';
import dynamicImportVars from 'rollup-plugin-dynamic-import-variables';

export default defineConfig({
    build: {
        rollupOptions: {
            external: [

            ]
        }
    }
});