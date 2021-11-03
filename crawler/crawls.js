const axios = require("axios");
const cheerio = require("cheerio");
const parse = require("url-parse");
const fs = require("fs");

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const { SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG } = require("constants");
const { isString } = require("util");
const argv = yargs(hideBin(process.argv))
	.option("website", {
		alias: "w",
		description: "Spesify website url that want to be crawled from.",
		type: "string",
	})
	.option("max", {
		alias: "m",
		description: "Spesify max value that crawled. (default 100)",
		type: "number",
	})
	.parse();

process.on("exit", exitHandler.bind(null, { cleanup: true })); //do something when app is closing
process.on("SIGINT", exitHandler.bind(null, { exit: true })); //catches ctrl+c event
process.on("SIGUSR1", exitHandler.bind(null, { exit: true })); // catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
process.on("uncaughtException", exitHandler.bind(null, { exit: true })); //catches uncaught exceptions

/**
 * Configuration goes below.
 */
const URL = argv.website;
if (!URL) {
	console.log("Please spesify website url, use -w [URL].");
	process.exit();
}

const fileName = "../crawled.json";
const metaName = {
	title: "og:title",
	desc: "og:description",
};
let max = argv.max ? argv.max : 100;

/**
 * Algorithm.
 */
let id = { id: 0 };
if (fs.existsSync("./_id.json")) id = require("./_id.json");

let counter = 0;

console.log("Crawling " + max + " pages.");

let crawled = {};
if (fs.existsSync("./_crawl_cache.json"))
	crawled = require("./_crawl_cache.json");

let percent = (counter / max) * 100;
process.stdout.write("Crawling... " + percent + "%");

crawl(URL).catch((e) => console.log(e));

/** FUNCTIONS */

/**
 * Exit Handler function
 *
 * @param {Object} options
 * @param {Object} exitCode
 */
function exitHandler(options, exitCode) {
	if (options.cleanup) {
		fs.writeFileSync("_crawl_cache.json", JSON.stringify(crawled));
		fs.writeFileSync("_id.json", JSON.stringify(id));
		console.log("\nSaved!");
	}
	if (options.exit) process.exit();
}

function fixUrl(parentUrl, url) {
	if (typeof url !== "string") {
		console.log("not string");
		return "";
	}

	if (url.match(/^#/g)) {
		const parsed_url = parse(parentUrl);
		return parsed_url.protocol + "//" + parsed_url.host;
	}

	url = url.replace(/\#\w+/g, "");

	if (url.match(/^javascript/g)) {
		return;
	}

	if (url.match(/^\/\//g)) {
		return parse(parentUrl).protocol + url;
	}

	if (!url.match(/^http/g) || url.match(/^\/\//g)) {
		const parsed_url = parse(parentUrl);
		parsed_url.set("pathname", url);
		return parsed_url.href;
	}

	return url;
}

function changeWikiUri(url) {
	let lastUri = url.split("/").at(-1);
	return "https://en.wikipedia.org/api/rest_v1/page/summary/" + lastUri;
}

async function crawlWikipedia(url) {
	const changedUrl = changeWikiUri(url);
	try {
		const reshtml = await axios.get(encodeURI(url));
		const html = reshtml.data;
		const $ = cheerio.load(html);
		const links = $("a")
			.map((i, data) => data.attribs.href)
			.get();

		axios
			.get(encodeURI(changedUrl))
			.then((response) => {
				const resJSON = response.data;
				let { title, extract } = resJSON;

				if (extract === "") extract = title;

				if (url === URL && !fs.existsSync(fileName)) {
					fs.writeFileSync(fileName, "[]");
				}

				if (title && extract) {
					if (counter < max) {
						writeData(url, title, extract);
					}
				}

				links.forEach((link, i) => {
					setTimeout(() => {
						crawl(fixUrl(url, link));
					}, i * 1000);
				});
			})
			.catch((e) => {
				// DO NOTHING
				// console.log(e.message);
			});
	} catch (e) {
		// console.log("From Wiki: ", e.message);
	}
}

/**
 * Function to crawl website
 *
 * @param {string} url
 * @returns
 */
async function crawl(url) {
	// console.log(`counter: ${counter}, id: ${id.id}, max: ${max}`);

	if (crawled[url]) {
		return;
	}
	if (counter >= max) {
		console.log("Exit...");
		exitHandler({ exit: true }, 0);
	}

	crawled[url] = true;
	try {
		if (url.match(/^https?:\/\/\w+.wikipedia.org\/wiki.+/g)) {
			await crawlWikipedia(url);
			return;
		}

		const response = await axios.get(encodeURI(url));
		const html = response.data;
		const $ = cheerio.load(html);
		const links = $("a")
			.map((i, data) => data.attribs.href)
			.get();

		const title =
			$(`meta[property=${metaName.title}]`).attr("content") ||
			$(`title`).text();
		const desc = $(`meta[property=${metaName.desc}]`).attr("content");

		if (url === URL && !fs.existsSync(fileName)) {
			fs.writeFileSync(fileName, "[]");
		}

		if (title && desc) {
			if (counter < max) {
				writeData(url, title, desc);
			}
		}

		links.forEach((link, i) => {
			setTimeout(() => {
				crawl(fixUrl(url, link));
			}, i * 1000);
		});
	} catch (e) {
		// DO NOTHING
		// console.log("From crawl: ", e.message);
	}
}

function writeData(url, title, content) {
	let data = fs.readFileSync(fileName, "utf8");
	obj = JSON.parse(data);
	obj.push({
		id: id.id,
		title: title,
		desc: content,
		link: url,
	});
	json = JSON.stringify(obj);
	fs.writeFileSync(fileName, json, "utf8");
	process.stdout.clearLine();
	process.stdout.cursorTo(0);

	percent = Math.round((counter / max) * 100);
	process.stdout.write("Crawling... " + percent + "%");
	counter++;
	id.id++;
}
