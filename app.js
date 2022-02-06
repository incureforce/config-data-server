const http = require("http");
const handler = require("./app-handler");

const server = http.createServer(async (req, res) => {
    await handler.handle(req, res);
});

server.listen(8080);