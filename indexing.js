const natural = require("natural");
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

const fs = require("fs");

const query = "Covid-19 make a disaster of protein.";

const articles = JSON.parse(fs.readFileSync("crawled.json", "utf8"));

articles.forEach((article) => {
	tfidf.addDocument(article.title + " " + article.desc);
});

tfidf.tfidfs(query, function (i, measure) {
	console.log("document #" + i + " is " + measure);
});
