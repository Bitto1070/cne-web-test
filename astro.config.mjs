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
	site: 'https://codename-engine.com',
	server: {
		open: true
	},
	 devToolbar: {
		enabled: false
	}
});
