var parse = require("url-parse");

function fixUrl(parentUrl, url) {
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

console.log(fixUrl("https://en.wikipedia.org/", "//andi.com#syasad"));
