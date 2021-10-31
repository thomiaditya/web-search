const axios = require("axios");
const cheerio = require("cheerio");
const Parser = require("url-parse");
const fs = require("fs");

/**
 * Configuration goes below.
 */
const URL = "https://www.nature.com/";
const fileName = "result.json";
const metaName = {
	title: "dc.title",
	desc: "dc.description",
};

/**
 * Algorithm.
 */
const parsed_url = new Parser(URL);
const crawled = {};
const fixUrl = (url) => {
	if (!url.includes("http")) {
		parsed_url.set("pathname", url);
		return parsed_url.href;
	}
	return url;
};

const crawl = async (url) => {
	if (crawled[url]) return;
	if (!url.includes(parsed_url.host)) return;

	crawled[url] = true;

	console.log(`crawling ${url}`);
	try {
		const response = await axios.get(url);
		const html = response.data;
		const $ = cheerio.load(html);
		const links = $("a")
			.map((i, data) => data.attribs.href)
			.get();

		const content = $(`meta[name=${metaName.title}]`).attr("content");
		const desc = $(`meta[name=${metaName.desc}]`).attr("content");

		if (url === URL) {
			fs.writeFileSync(fileName, "[]");
		}

		if (content || desc) {
			let data = fs.readFileSync(fileName, "utf8");
			obj = JSON.parse(data);
			obj.push({
				title: content,
				desc: desc,
				link: url,
			});
			json = JSON.stringify(obj);
			fs.writeFileSync(fileName, json, "utf8");
		}

		links.forEach((link) => {
			crawl(fixUrl(link));
		});
	} catch (e) {
		console.log("-");
	}
};

crawl(URL).catch((e) => console.log(e));
