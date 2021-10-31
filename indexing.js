const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
const fs = require("fs");

const articles = JSON.parse(fs.readFileSync("crawled.json", "utf8"));

const stopWords = require("./_stop-words");

const words = {};

articles.forEach((article, i) => {
	const tokens = tokenizer.tokenize(article.title + " " + article.desc);
	tokens.forEach((token) => {
		const lower = token.toLowerCase();
		if (stopWords.includes(lower)) return;
		const word = natural.PorterStemmer.stem(lower);

		if (!words[word]) words[word] = { count: 0, docs: [] };
		words[word].docs.push(i);
		words[word].count++;
	});
});

fs.writeFileSync("_teststem.json", JSON.stringify(words), "utf8");
