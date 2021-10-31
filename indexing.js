const natural = require("natural");
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

const fs = require("fs");

// const query = "Covid-19 make a disaster of protein.";

const articles = JSON.parse(fs.readFileSync("crawled.json", "utf8"));

const recommend = (query) => {
	const result = [];
	const res = [];
	articles.forEach((article) => {
		tfidf.addDocument(article.title + " " + article.desc);
	});

	tfidf.tfidfs(query, function (i, measure) {
		result.push([i, measure]);
	});

	const sorted = result.sort((a, b) => {
		return b[1] - a[1];
	});

	const filtered = sorted.filter((val) => {
		return val[1] > 0;
	});

	filtered.map((val) => {
		res.push(articles[val[0]]);
	});

	return res;
};

module.exports = recommend;
