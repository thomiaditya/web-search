var Crawler = require("crawler");

const fileName = "../crawled.json";
const metaName = {
	title: "og:title",
	desc: "og:description",
};

var c = new Crawler({
	maxConnections: 10,
	// This will be called for each crawled page
	callback: function (error, res, done) {
		if (error) {
			console.log(error);
		} else {
			var $ = res.$;
			// $ is Cheerio by default
			//a lean implementation of core jQuery designed specifically for the server
			// console.log($("title").text());
			try {
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
			} catch (e) {
				//
			}
		}
		done();
	},
});

// Queue just one URL, with default callback
c.queue("https://www.nature.com");

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
