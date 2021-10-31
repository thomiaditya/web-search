const express = require("express");
const app = express();
const search = require("./indexing");
const port = 3000;

app.get("/search", (req, res) => {
	res.json(search(req.query.q));
});

app.listen(port, () => {
	console.log(`App listening at http://localhost:${port}`);
});
