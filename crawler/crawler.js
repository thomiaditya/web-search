const axios = require("axios");
const cheerio = require("cheerio");
const Parser = require("url-parse");
const fs = require("fs");

/**
 * Configuration goes below.
 */
const URL = process.argv[2];
const fileName = "../crawled2.json";
const metaName = {
	title: "og:title",
	desc: "og:description",
};
let max = 1000;

/**
 * Algorithm.
 */
let id = { id: 0 };
if (fs.existsSync("./_id.json")) id = require("./_id.json");

let counter = 0;

console.log("Crawling " + max + " pages.");

const parsed_url = new Parser(URL);
let crawled = {};
if (fs.existsSync("./_crawl_cache.json"))
	crawled = require("./_crawl_cache.json");

function exitHandler(options, exitCode) {
	if (options.cleanup) {
		fs.writeFileSync("_crawl_cache.json", JSON.stringify(crawled));
		fs.writeFileSync("_id.json", JSON.stringify(id));
		console.log("Saved!");
	}
	if (exitCode || exitCode === 0) console.log(exitCode);
	if (options.exit) process.exit();
}

//do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

const fixUrl = (url) => {
	if (url.includes("#")) {
		url = url.replace(/\#\w+/g, "");
	}
	if (!url.includes("http")) {
		parsed_url.set("pathname", url);
		return parsed_url.href;
	}

	return url;
};

let percent = (counter / max) * 100;
process.stdout.write("Crawling... " + percent + "%");

const crawl = async (url) => {
	if (crawled[url]) return;
	if (counter >= max) {
		exitHandler.bind(null, { exit: true });
	}
	// if (!url.includes(parsed_url.host)) return;

	crawled[url] = true;

	// console.log(`crawling ${url}`);

	try {
		const response = await axios.get(url);
		const html = response.data;
		const $ = cheerio.load(html);
		const links = $("a")
			.map((i, data) => data.attribs.href)
			.get();

		// const content = $(`meta[property=${metaName.title}]`).attr("content");
		const content =
			$(`meta[property=${metaName.title}]`).attr("content") ||
			$(`title`).text();
		const desc = $(`meta[property=${metaName.desc}]`).attr("content");

		if (url === URL && !fs.existsSync(fileName)) {
			fs.writeFileSync(fileName, "[]");
		}

		if (content && desc) {
			let data = fs.readFileSync(fileName, "utf8");
			obj = JSON.parse(data);
			obj.push({
				id: id.id,
				title: content,
				desc: desc,
				link: url,
			});
			json = JSON.stringify(obj);
			if (counter < max) {
				fs.writeFileSync(fileName, json, "utf8");
				process.stdout.clearLine();
				process.stdout.cursorTo(0);

				percent = Math.round((counter / max) * 100);
				process.stdout.write("Crawling... " + percent + "%");
				counter++;
				id.id++;
			}
		}

		links.forEach((link) => {
			crawl(fixUrl(link));
		});
	} catch (e) {
		// DO NOTHING
	}
};

crawl(URL).catch((e) => console.log(e));
