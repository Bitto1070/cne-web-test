import { defineConfig } from 'astro/config';
import alpine from '@astrojs/alpinejs';
import mdx from "@astrojs/mdx";

// used for the default layout for md files (wiki)
const setLayout = () => {
	return function (_, file) {
		file.data.astro.frontmatter.layout =
		file.data.astro.frontmatter.layout || "./src/layouts/wiki.astro";
	};
};

export default defineConfig({
	markdown: {
		smartypants: false,
		remarkPlugins: [setLayout],
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
