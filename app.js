const express = require("express");
const app = express();
const search = require("./indexing");
const path = require("path");
const port = 3000;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.use("/css", express.static(path.resolve(__dirname, "assets/css")));

app.get("/", (req, res) => {
	let searching = [];
	if (req.query.q) {
		searching = search(req.query.q);
	}
	res.render("index", { searches: searching });
});

app.listen(port, () => {
	console.log(`App listening at http://localhost:${port}`);
});
