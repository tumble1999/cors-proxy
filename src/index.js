"use strict";
const webserver = require("tn-webserver");
const express = require("express");
const request = require("request");
const absolutify = require("absolutify");
const imageDataURI = require("image-data-uri");

//middleware
const cors = require("cors"); z;

let app = express();
app.use(async (req, res, next) => {
	console.log("__**" + [req.method, req.path].join(" ") + "**__");
	next();
});

/**
 * Settings
 */
app.set("json spaces", 2);
/**
 * Middleware
 */

//enable CORS
app.use(cors());
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	next();
});

app.use(function (err, req, res, next) {
	if (!err) next();
	console.error(err.stack);
	res.status(500).send(err.stack);
});

function getHostName(url) {
	let nohttp = url.replace("http://", "").replace("https://", "");
	let http = url.replace(nohttp, "");
	let hostname = http + nohttp.split(/[/?#]/)[0];
	return hostname;
}

app.use("/", (req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	next();
});

/**
 * Paths
 */

/* /data/(url) */
app.use("/data", async (req, res) => {
	let url = req.path.substr(1);
	console.log("URL:", url);
	if (!url) {
		res.set("Content-Type", "application/json");
		res.type("application/json");
		res.status(400).send(`{"err": "No URL provided."`);
		return;
	}
	try {
		imageDataURI.encodeFromURL(url).then(data => {
			res.json({ url: data });
		});
	} catch (err) {
		console.log(err);
		res.set("Content-Type", "application/json");
		res.type("application/json");
		res.status(503).send(`{"err": "${err}"`);
		return;
	}
});

/* /file/(url) */
app.use("/file", async (req, res) => {
	let url = req.path.substr(1);
	console.log("URL:", url);
	if (!url) {
		res.set("Content-Type", "application/json");
		res.type("application/json");
		res.status(400).send(`{"err": "No URL provided."`);
		return;
	}
	request(url).pipe(res);
});

// /(url)
app.use("/", async (req, res) => {
	let url = req.path.substr(1);
	console.log("URL:", url);
	if (!url) {
		res.set("Content-Type", "application/json");
		res.type("application/json");
		res.status(400).send(`{"err": "No URL provided."`);
		return;
	}
	try {
		let document = "";
		let i = 0;

		let settings = {
			url: url,
			encoding: null
		};

		request(settings, function (sub_err, sub_res, sub_body) {
			let i = 0;
			let document = sub_body;
			while (i < sub_res.rawHeaders.length) {
				res.set(sub_res.rawHeaders[i], sub_res.rawHeaders[i + 1]);
				i += 2;
			}
			if (sub_res.caseless.dict["content-type"] == "text/html") {
				document = absolutify(sub_body, `/cors/${getHostName(url)}`);
			}
			res.send(document);
		});
	} catch (err) {
		console.log(err);
		res.set("Content-Type", "application/json");
		res.type("application/json");
		res.status(503).send(`{"err": "${err}"`);
		return;
	}
});
webserver(app);
