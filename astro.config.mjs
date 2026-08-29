import { defineConfig } from 'astro/config';
import alpine from '@astrojs/alpinejs';
import mdx from "@astrojs/mdx";

export default defineConfig({
	markdown: {
		smartypants: false,
		syntaxHighlight: 'prism',
	},
	integrations: [alpine(), mdx({
		extendMarkdownConfig: true
	})],
	site: 'https://codenamecrew.github.io/cne-web-test',
	// base: '/cne-web-test',
	server: {
		open: true
	},
	devToolbar: {
		enabled: false
	},
	redirects: {
		'index': '../'
	}
});
