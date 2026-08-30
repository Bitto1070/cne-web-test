// hxdoc - tiny api doc generator for haxe
// usage: node hxdoc.js <srcDir> <outDir> [--title "My Library"]
// parses .hx files, reads doc comments + signatures.
// the result? you get htm- i mean astros for each class.

// ok now betty if you see this
// have fun styling ts.

// betty here: export to src/content/api-docs/ pls

const fs = require("node:fs");
const path = require("node:path");

// client

const args = process.argv.slice(2);
if (args.length < 2) {
	console.log('usage: node hxdoc.js <srcDir> <outDir> [--title "My Library"]');
	process.exit(1);
}
const SRC = path.resolve(args[0]);
const OUT = path.resolve(args[1]);
const TITLE = (() => {
	const i = args.indexOf("--title");
	return i !== -1 && args[i + 1] ? args[i + 1] : "API Documentation";
})();
const PAGE_IMPORT = (() => {
	const i = args.indexOf("--page");
	return i !== -1 && args[i + 1] ? args[i + 1] : "../../components/Page.astro";
})();


// scan the directory for any hx file
function findHxFiles(dir) {
	const stat = fs.statSync(dir);
	if (stat.isFile()) return dir.endsWith(".hx") ? [dir] : [];
	let out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out = out.concat(findHxFiles(full));
		else if (entry.name.endsWith(".hx")) out.push(full);
	}
	return out;
}

// le parser

function parseFile(source, filePath) {
	const pkg = (source.match(/^\s*package\s+([\w.]*)\s*;/m) || [])[1] || "";
	const classes = [];

	let i = 0;
	let pendingDoc = null;
	let pendingMeta = [];
	let currentClass = null;
	let braceDepth = 0;
	let classDepth = -1;

	const len = source.length;

	function skipLineComment() { while (i < len && source[i] !== "\n") i++; }

	function readBlockComment() {
		const start = i;
		i += 2;
		while (i < len && !(source[i] === "*" && source[i + 1] === "/")) i++;
		i += 2;
		return source.slice(start, i);
	}

	function readString(quote) {
		i++;
		while (i < len && source[i] !== quote) {
			if (source[i] === "\\") i++;
			i++;
		}
		i++;
	}

	function readBalanced(open, close) {
		// assumes source[i] === open, returns content inside, leaves i after close
		let depth = 0;
		const start = i;
		while (i < len) {
			const c = source[i];
			if (c === '"' || c === "'") { readString(c); continue; }
			if (c === open) depth++;
			else if (c === close) { depth--; if (depth === 0) { i++; break; } }
			i++;
		}
		return source.slice(start + 1, i - 1);
	}

	function skipStringAt(j) {
		const q = source[j];
		j++;
		while (j < len && source[j] !== q) {
			if (source[j] === "\\") j++;
			j++;
		}
		return j + 1;
	}

	function declStartBefore(pos) {
		// start of the declaration line, after the previous statement or doc comment
		const region = source.slice(0, pos);
		const cands = [region.lastIndexOf(";"), region.lastIndexOf("}"), region.lastIndexOf("{")];
		const cm = region.lastIndexOf("*/");
		if (cm !== -1) cands.push(cm + 1);
		let start = Math.max(...cands) + 1;
		while (start < pos && /\s/.test(source[start])) start++;
		return start;
	}

	function findBodyEnd(from) {
		// end index (exclusive) of a function body starting at or after `from`,
		// either a balanced { } block or an expression body ending in ;
		let j = from;
		while (j < len && /\s/.test(source[j])) j++;
		let d = 0;
		const block = source[j] === "{";
		while (j < len) {
			const ch = source[j];
			if (ch === '"' || ch === "'") { j = skipStringAt(j); continue; }
			if (ch === "/" && source[j + 1] === "/") { while (j < len && source[j] !== "\n") j++; continue; }
			if (ch === "/" && source[j + 1] === "*") { j += 2; while (j < len && !(source[j] === "*" && source[j + 1] === "/")) j++; j += 2; continue; }
			if (ch === "{" || ch === "(" || ch === "[") d++;
			else if (ch === "}" || ch === ")" || ch === "]") {
				d--;
				if (block && ch === "}" && d === 0) return j + 1;
			}
			else if (!block && ch === ";" && d <= 0) return j + 1;
			j++;
		}
		return j;
	}

	function dedent(code) {
		const lines = code.split("\n");
		let min = Infinity;
		for (const l of lines) {
			if (!l.trim()) continue;
			const m = l.match(/^[\t ]*/)[0].length;
			if (m < min) min = m;
		}
		if (!isFinite(min) || min === 0) return code; // O' Math.isNaN... where were you when i needed you...?
		return lines.map(l => l.slice(min)).join("\n");
	}

	function modifiersBefore(pos) {
		// only the raw code between the previous comment and this keyword
		let tail = source.slice(Math.max(0, pos - 200), pos);
		const cm = tail.lastIndexOf("*/");
		if (cm !== -1) tail = tail.slice(cm + 2);
		tail = tail.split(";").pop().split("}").pop().split("{").pop();
		return {
			isPublic: /\bpublic\b/.test(tail),
			isPrivate: /\bprivate\b/.test(tail),
			isStatic: /\bstatic\b/.test(tail),
			isInline: /\binline\b/.test(tail)
		};
	}

	function readType() {
		// it reads a type annotation after ':' handling <>, {}, ->
		// and stops at a function body '{', at ';', '=', or at end of line so it
		// also it never eats braces that belong to code (that desyncs depth tracking)
		// with that being said i forgot i have a pure math exam tommorow
		// update: it was fucking bad
		let out = "";
		let angle = 0, brace = 0, paren = 0;
		const atTop = () => angle === 0 && brace === 0 && paren === 0;
		while (i < len) {
			const c = source[i];
			if (c === "<") angle++;
			else if (c === ">") {
				if (source[i - 1] !== "-") { // not part of ->
					if (angle === 0) break;
					angle--;
				}
			}
			else if (c === "(") paren++;
			else if (c === ")") { if (paren === 0) break; paren--; }
			else if (c === "{") {
				// anon struct only if it's the start of the type or nested in one,
				// otherwise it's a block body and the type ends here
				if (atTop() && out.trim() !== "") break;
				brace++;
			}
			else if (c === "}") { if (brace === 0) break; brace--; }
			else if ((c === ";" || c === "=" || c === ",") && atTop()) break;
			else if (c === "\n" && atTop() && out.trim() !== "") break; // expression-bodied fn
			out += c;
			i++;
		}
		return out.trim();
	}

	while (i < len) {
		const c = source[i];

		if (c === "/" && source[i + 1] === "/") { skipLineComment(); continue; }
		if (c === "/" && source[i + 1] === "*") {
			const block = readBlockComment();
			if (block.startsWith("/**")) pendingDoc = block;
			continue;
		}
		if (c === '"' || c === "'") { readString(c); continue; }

		if (c === "@") {
			// metadata like @:deprecated("...") or @:noCompletion
			let s = i;
			i++;
			if (source[i] === ":") i++;
			while (i < len && /[\w]/.test(source[i])) i++;
			let meta = source.slice(s, i);
			if (source[i] === "(") meta += "(" + readBalanced("(", ")") + ")";
			pendingMeta.push(meta);
			continue;
		}

		if (c === "{") { braceDepth++; i++; continue; }
		if (c === "}") {
			braceDepth--;
			if (currentClass && braceDepth <= classDepth) { currentClass = null; classDepth = -1; }
			i++;
			continue;
		}

		// keywords
		if (/[a-zA-Z_]/.test(c)) {
			let s = i;
			while (i < len && /[\w]/.test(source[i])) i++;
			var word = source.slice(s, i);
			const classKeywords = ['class', 'enum', 'abstract', 'interface', 'typedef', 'final']
			if ((classKeywords.includes(word)) && braceDepth === 0) {
				const cmods = modifiersBefore(s);
				// read name
				while (i < len && /\s/.test(source[i])) i++;
				let ns = i;
				while (i < len && /[\w]/.test(source[i])) i++;
				var name = source.slice(ns, i);

				// fix enum abstracts exporting "abstract.json"
				while (classKeywords.includes(name)) {
					word += ' ' + name;
					ns += name.length + 1;
					while (i < len && /\s/.test(source[i])) i++;
					ns = i;
					while (i < len && /[\w]/.test(source[i])) i++;
					name = source.slice(ns, i);
				}
				currentClass = {
					kind: word,
					name,
					pkg,
					file: filePath,
					doc: cleanDoc(pendingDoc),
					meta: pendingMeta,
					fields: []
				};
				if (!cmods.isPrivate) classes.push(currentClass);
				pendingDoc = null;
				pendingMeta = [];
				// class body starts at next '{'
				classDepth = braceDepth;
				continue;
			}

			if (word === "function" && currentClass && braceDepth === classDepth + 1) {
				const mods = modifiersBefore(s);
				while (i < len && /\s/.test(source[i])) i++;
				let ns = i;
				while (i < len && /[\w]/.test(source[i])) i++;
				const name = source.slice(ns, i);
				while (i < len && /\s/.test(source[i])) i++;
				let argsRaw = "";
				if (source[i] === "(") argsRaw = readBalanced("(", ")");
				while (i < len && /\s/.test(source[i])) i++;
				let ret = "";
				if (source[i] === ":") { i++; ret = readType(); }

				const visible = mods.isPublic && !mods.isPrivate;
				if (name && visible) {
					const src = dedent(source.slice(declStartBefore(s), findBodyEnd(i)));
					currentClass.fields.push({
						kind: "function",
						name,
						args: parseArgs(argsRaw),
						ret: ret || "Void",
						isStatic: mods.isStatic,
						isInline: mods.isInline,
						src,
						doc: cleanDoc(pendingDoc),
						meta: pendingMeta
					});
				}
				pendingDoc = null;
				pendingMeta = [];
				continue;
			}

			if (word === "var" && currentClass && braceDepth === classDepth + 1) {
				const vm = modifiersBefore(s);
				const isPublic = vm.isPublic, isStatic = vm.isStatic;
				while (i < len && /\s/.test(source[i])) i++;
				let ns = i;
				while (i < len && /[\w]/.test(source[i])) i++;
				const name = source.slice(ns, i);
				while (i < len && /\s/.test(source[i])) i++;
				let access = "";
				if (source[i] === "(") access = readBalanced("(", ")");
				while (i < len && /\s/.test(source[i])) i++;
				let type = "";
				if (source[i] === ":") { i++; type = readType(); }
				if (name && isPublic) {
					currentClass.fields.push({
						kind: "var",
						name,
						type: type || "Dynamic",
						access,
						isStatic,
						doc: cleanDoc(pendingDoc),
						meta: pendingMeta
					});
				}
				pendingDoc = null;
				pendingMeta = [];
				continue;
			}

			if (word === "final" && currentClass && braceDepth === classDepth + 1) {
				const fm = modifiersBefore(s);
				const isPublic = fm.isPublic, isStatic = fm.isStatic;
				while (i < len && /\s/.test(source[i])) i++;
				let ns = i;
				while (i < len && /[\w]/.test(source[i])) i++;
				const name = source.slice(ns, i);
				while (i < len && /\s/.test(source[i])) i++;
				let type = "";
				if (source[i] === ":") { i++; type = readType(); }
				if (name && isPublic) {
					currentClass.fields.push({
						kind: "final",
						name,
						type: type || "Dynamic",
						isStatic,
						doc: cleanDoc(pendingDoc),
						meta: pendingMeta
					});
				}
				pendingDoc = null;
				pendingMeta = [];
				continue;
			}
			continue;
		}

		i++;
	}

	return classes.filter(c => c.kind !== "typedef" || c.fields.length);
}

function parseArgs(raw) {
	if (!raw.trim()) return [];
	// split on commas at depth 0
	const parts = [];
	let depth = 0, cur = "";
	for (let j = 0; j < raw.length; j++) {
		const ch = raw[j];
		if (ch === "<" || ch === "{" || ch === "(") depth++;
		else if ((ch === ">" && raw[j - 1] !== "-") || ch === "}" || ch === ")") depth--;
		if (ch === "," && depth === 0) { parts.push(cur); cur = ""; }
		else cur += ch;
	}
	if (cur.trim()) parts.push(cur);
	return parts.map(p => {
		p = p.trim();
		const optional = p.startsWith("?");
		if (optional) p = p.slice(1);
		const eq = splitTop(p, "=");
		const def = eq.length > 1 ? eq[1].trim() : null;
		const colon = splitTop(eq[0], ":");
		return {
			name: colon[0].trim(),
			type: colon[1] ? colon[1].trim() : "Dynamic",
			optional,
			def
		};
	});
}

function splitTop(str, sep) {
	const open = { "<": 1, "{": 1, "(": 1 };
	const close = { "}": 1, ")": 1, ">": 1 };

	let depth = 0;

	for (let i = 0; i < str.length; i++) {
		const ch = str[i];

		if (open[ch]) depth++;
		else if (close[ch] && (ch !== ">" || str[i - 1] !== "-")) depth--;
		else if (ch === sep && depth === 0) return [str.slice(0, i), str.slice(i + 1)];
	}

	return [str];
}

function cleanDoc(block) {
	if (!block) return null;

	const doc = { text: [], params: {}, returns: null, throws: null, deprecated: null };

	for (const line of block.replace(/^\/\*\*|\*+\/$/g, "").split("\n").map(l => l.replace(/^\s*\*\s?/, "").trimEnd())) {
		const tag = line.trim().match(/^@(param|returns?|throws|deprecated)\s*(.*)$/);

		if (!tag) {
			doc.text.push(line);
			continue;
		}

		const [, type, value] = tag;

		switch (type) {
			case "param": {
				const [, name, desc = ""] = value.match(/^(\w+)\s*(.*)$/) || [];
				if (name) doc.params[name] = desc;
				break;
			}
			case "return":
			case "returns":
				doc.returns = value;
				break;
			case "throws":
				doc.throws = value;
				break;
			case "deprecated":
				doc.deprecated = value || "Deprecated.";
		}
	}

	doc.text = doc.text.join("\n").trim();
	return doc;
}

// astro

const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function typeHtml(t) {
	// hyperlink known class names, color the rest
	return esc(t).replace(/\b([A-Z]\w*)\b/g, (m, name) => {
		if (KNOWN.has(name)) return `<a href="${name}">${name}</a>`;
		return `<span class="token class-name">${name}</span>`;
	});
}

function sigHtml(f) {
	if (f.kind === "function") {
		const argStr = f.args.map(a => `${a.optional ? "<span class='token keyword'>?</span>" : ""}<span class="arg">${esc(a.name)}</span>:${typeHtml(a.type)}${a.def ? `<span class="def"> = ${esc(a.def)}</span>` : ""}`).join(", ");
		return `${f.isStatic ? '<span class="token keyword">static</span> ' : ""}${f.isInline ? '<span class="token keyword">inline</span> ' : ""}<span class="token keyword">function</span> <span class="token function">${esc(f.name)}</span>(${argStr}):${typeHtml(f.ret)}`;
	}
	const kw = f.kind === "final" ? "final" : "var";
	return `${f.isStatic ? '<span class="token keyword">static</span> ' : ""}<span class="token keyword">${kw}</span> ${esc(f.name)}${f.access ? `(${esc(f.access)})` : ""}:${typeHtml(f.type)}`;
}

function isDeprecated(f) {return (f.doc && f.doc.deprecated) || (f.meta || []).some(m => m.startsWith("@:deprecated"));}

function deprecationMsg(f) {
	if (f.doc && f.doc.deprecated) return f.doc.deprecated;
	const m = (f.meta || []).find(m => m.startsWith("@:deprecated"));
	if (m) {
		const inner = m.match(/\("(.*)"\)/);
		return inner ? inner[1] : "Deprecated.";
	}
	return "";
}
const SIDEBAR_JS = `
function fuzzy(q, s) {
	q = q.toLowerCase(); s = s.toLowerCase();
	if (!q) return true;
	var i = 0;
	for (var j = 0; j < s.length && i < q.length; j++) if (s[j] === q[i]) i++;
	return i === q.length;
}
document.querySelector(".search").addEventListener("input", function () {
	var q = this.value.trim();
	document.querySelectorAll("nav > ul > li, nav ul:not(.mem) > li").forEach(function (li) {
		if (li.parentElement.classList.contains("mem")) return;
		var cls = li.getAttribute("data-name") || "";
		var classHit = fuzzy(q, cls);
		var memberHit = false;
		li.querySelectorAll(".mem > li").forEach(function (mli) {
			var hit = q !== "" && fuzzy(q, mli.getAttribute("data-name") || "");
			mli.classList.toggle("mhit", hit);
			if (hit) memberHit = true;
		});
		li.classList.toggle("hidden", !(classHit || memberHit) && q !== "");
		li.classList.toggle("expanded", memberHit && q !== "");
	});
});
`;

let KNOWN = new Set();

function hlHaxe(code) {
	// escape first, then color in one pass over token boundaries so
	// replacements never touch each other's output
	const KW = new Set(["public","private","static","inline","function","var","final","return","if","else","for","while","do","switch","case","default","try","catch","throw","new","this","null","true","false","break","continue","in","cast","untyped","using","import","package","extends","implements","override","macro","enum","class","interface","abstract","typedef"]);
	let out = "";
	let i = 0;
	const n = code.length;
	while (i < n) {
		const c = code[i];
		if (c === "/" && code[i + 1] === "/") {
			let j = i; while (j < n && code[j] !== "\n") j++;
			out += `<span class="token comment">${esc(code.slice(i, j))}</span>`; i = j; continue;
		}
		if (c === "/" && code[i + 1] === "*") {
			let j = i + 2; while (j < n && !(code[j] === "*" && code[j + 1] === "/")) j++;
			j = Math.min(n, j + 2);
			out += `<span class="token comment">${esc(code.slice(i, j))}</span>`; i = j; continue;
		}
		if (c === '"' || c === "'") {
			let j = i + 1;
			while (j < n && code[j] !== c) { if (code[j] === "\\") j++; j++; }
			j = Math.min(n, j + 1);
			out += `<span class="token string">${esc(code.slice(i, j))}</span>`; i = j; continue;
		}
		if (/[A-Za-z_]/.test(c)) {
			let j = i; while (j < n && /[\w]/.test(code[j])) j++;
			const w = code.slice(i, j);
			if (KW.has(w)) out += `<span class="token keyword">${w}</span>`;
			else if (/^[A-Z]/.test(w)) out += `<span class="token class-name">${w}</span>`;
			else out += esc(w);
			i = j; continue;
		}
		if (/[0-9]/.test(c)) {
			let j = i; while (j < n && /[\w.]/.test(code[j])) j++;
			out += `<span class="token number">${esc(code.slice(i, j))}</span>`; i = j; continue;
		}
		out += esc(c); i++;
	}
	return out;
}
// after coding this, i'd like to let you know that im never doing ts again

function page(title, sidebar, content) {
	return `---
import Page from '${PAGE_IMPORT}';
import './src/styles/code.css';
---
<Page title="API - ${esc(title)}">
	<div class="panel" style="width: fit-content; margin: auto;">
		<h1>${title}</h1>
		${content}
	</div>
	<script is:inline>
		${SIDEBAR_JS}
	</script>
</Page>
`;
}

function buildSidebar(classes, activeName) {
	const byPkg = {};
	for (const c of classes) (byPkg[c.pkg] = byPkg[c.pkg] || []).push(c);
	let html = "";
	for (const pkg of Object.keys(byPkg).sort()) {
		html += `<div class="pkg">\n${esc(pkg || "(root)")}\n</div>\n<ul>\n`;
		for (const c of byPkg[pkg].sort((a, b) => a.name.localeCompare(b.name))) {
			html += `<li data-name="${esc(c.name)}"><a href="${c.name}"${c.name === activeName ? ' class="active"' : ""}>\n<span class="k">${c.kind[0].toUpperCase()}</span>${esc(c.name)}\n</a>`;
			if (c.fields.length) {
				html += `<ul class="mem">\n`;
				for (const f of c.fields) html += `<li data-name="${esc(f.name)}">\n<a href="${c.name}#${esc(f.name)}">\n${esc(f.name)}\n</a>\n</li>`;
				html += `</ul>\n`;
			}
			html += `</li>\n`;
		}
		html += "</ul>\n";
	}
	return html;
}

function docTextHtml(text) {
	return esc(text).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
}

function buildClassPage(cls, sidebar) {
	const vars = cls.fields.filter(f => f.kind !== "function");
	const funcs = cls.fields.filter(f => f.kind === "function" && !isDeprecated(f));
	const deprecated = cls.fields.filter(f => f.kind === "function" && isDeprecated(f));

	let body = '';

	function renderField(f) {
		const dep = isDeprecated(f);
		let h = `<div class="subpanel" id="${esc(f.name)}">`;
		const sigInner = `${sigHtml(f)}`;
		h += `<code class="language-haxe inline-code">${sigInner}</code>`;
		if (dep) h += `<div class="depnote">${esc(deprecationMsg(f))}</div>`;
		if (f.doc && f.doc.text) h += `<div class="fdoc">${docTextHtml(f.doc.text)}</div>`;
		if (f.kind === "function" && f.doc && Object.keys(f.doc.params).length) {
			h += `<table class="params">`;
			for (const a of f.args) {
				if (!(a.name in f.doc.params)) continue;
				h += `<tr><td class="pn">${a.optional ? "?" : ""}${esc(a.name)}</td><td class="pt">${esc(a.type)}</td><td>${esc(f.doc.params[a.name])}</td></tr>`;
			}
			h += `</table>`;
		}
		if (f.doc && f.doc.returns) h += `<div class="returns"><b>Returns:</b> ${esc(f.doc.returns)}</div>`;
		if (f.doc && f.doc.throws) h += `<div class="returns"><b>Throws:</b> ${esc(f.doc.throws)}</div>`;
		h += `</div>\n`;
		return h;
	}

	body += vars.map((a) => renderField(a)).join('\n');

	return page(cls.name, sidebar, body);
}

function buildIndex(classes, sidebar) {
	let body = `<h1 class="classname">${esc(TITLE)}</h1>\n<div class="pkgline">${classes.length} types</div>\n<ul class="index-list">`;
	for (const c of classes.sort((a, b) => a.name.localeCompare(b.name))) {
		// i actually didnt know what was localeCompare, guess i do now
		const summary = c.doc && c.doc.text ? c.doc.text.split("\n")[0] : "";
		body += `<li>\n<a href="${c.name}">${esc(c.name)}</a>\n<div class="d">\n${esc(summary)}\n</div>\n</li>\n`;
	}
	body += `</ul>`;
	return page("Index", sidebar, body);
}

// main

const files = findHxFiles(SRC);
let allClasses = [];
for (const f of files) {
	try {
		allClasses = allClasses.concat(parseFile(fs.readFileSync(f, "utf8"), f));
	} catch (e) {
		console.error("failed to parse ts " + f + ": " + e.message);
	}
}

KNOWN = new Set(allClasses.map(c => c.name));

fs.mkdirSync(OUT, { recursive: true });
for (const cls of allClasses) {
	delete cls.file; // it puts the file path from my pc :(
	if (cls.pkg) {
		let a = cls.pkg.split('.');
		let newOut = OUT;
		while (a.length > 0) {
			newOut += '/' + a.shift();
			fs.mkdirSync(newOut, { recursive: true });
		}
	}
	fs.writeFileSync(path.join(OUT, 
		(cls.pkg ? (cls.pkg.split('.').join('/')) + "/" : "") + cls.name + ".json"),
		JSON.stringify(cls, null, '\t'));
}

console.log(`hxdoc: ${allClasses.length} types from ${files.length} files -> ${OUT}`);
for (const c of allClasses) {
	const pub = c.fields.length;
	console.log(`  ${c.pkg ? c.pkg + "." : ""}${c.name} (${pub} public members)`);
}

// after all this, i'd like to let you know im never coding in js ever again
