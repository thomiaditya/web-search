const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
const fs = require("fs");

const query = "Covid-19 make a disaster of protein.";

const articles = JSON.parse(fs.readFileSync("crawled.json", "utf8"));
articles.push({
	id: "Q",
	title: query,
	desc: "",
});

const stopWords = require("./_stop-words");

const words = {};

articles.forEach((article, i) => {
	const id = article.id;
	const tokens = tokenizer.tokenize(article.title + " " + article.desc);
	tokens.forEach((token) => {
		const lower = token.toLowerCase();
		if (stopWords.includes(lower)) return;
		const word = natural.PorterStemmer.stem(lower);

		if (!words[word]) words[word] = { count: 0, docs: {}, idf: 0 };
		if (!words[word].docs[id]) words[word].docs[id] = 0;

		words[word].docs[id] += 1;
		words[word].count++;
	});
});

for (const word in words) {
	let count = words[word].count;
	if ("Q" in words[word].docs) count -= words[word].docs["Q"];

	const idf = Math.log10(articles.length / count);
	words[word].idf = idf;

	for (const id in words[word].docs) {
		words[word].docs[id] *= idf;
	}
}

fs.writeFileSync("_teststem.json", JSON.stringify(words), "utf8");
console.log("Written");
