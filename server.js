const HTTP	= require("http");
const URL	= require("url");
const MIME	= require("mime");
const Path	= require("path");
const File	= require("fs");

let state = {};
let lastStateSent = null;

function nope(res, code, error) {
	console.log("Response", "	", code, error);
	let dataString = JSON.stringify({
		success: false,
		error: error
	});
	let length = Buffer.byteLength(dataString);
	res.writeHead(code, {
		'Access-Control-Allow-Origin'	: '*',
		'Content-Length'				: length,
		'Content-Type'					: 'application/json'
	});
	res.end(dataString);
}
function okay(res, data) {
	console.log("Response:", "	", 200, data);
	let dataString = JSON.stringify({
		success: true,
		data: data
	});
	let length = Buffer.byteLength(dataString);
	res.writeHead(200, {
		'Access-Control-Allow-Origin'	: '*',
		'Content-Length'				: length,
		'Content-Type'					: 'application/json'
	});
	res.end(dataString);
}
const server = HTTP.createServer((req, res) => {
	console.log("Request:", "	", req.url);
	let uri = URL.parse(req.url, true);
	let query = uri.query;
	if (query.beacon != null) {
		if (query.action == null)
			return nope(res, 400, "Action is required");
		if (['enter', 'leave'].indexOf(query.action) == -1)
			return nope(res, 400, "Neither entering nor leaving beacon ??");
		let now = Math.floor(Date.now() / 1000);
		if (state[query.beacon] == null)
			state[query.beacon] = {};
		state[query.beacon].status = (query.action == 'enter');
		state[query.beacon].last_update = now;
		return okay(res, "Done.\n");
	}
	let path = uri.pathname;
	let filename = Path.join('public', path);
	File.exists(filename, (exists) => {
		if (!exists) return nope(res, 404, "Not Found");
		if (File.statSync(filename).isDirectory()) filename += '/index.html';
		File.readFile(filename, "binary", (err, file) => {
			if (err) return nope(res, 500, "An error occured");
			res.writeHead(200, {"Content-Type": MIME.lookup(filename)});
			res.write(file, "binary");
			res.end();
			console.log(200, "OK");
		});
	})
});
const S = require("socket.io").listen(server.listen(8000, "0.0.0.0"));
S.on('connection', (socket) => {
	socket.emit('update', state);
	lastStateSent = JSON.stringify(state);
});
setInterval(() => {
	S.emit('update', state);
	if (lastStateSent != JSON.stringify(state)) {
		lastStateSent = JSON.stringify(state);
	}
}, 100);
console.log('Server is running on port 8000');
