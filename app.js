const http = require("http");
const handler = require("./app-handler");

const server = http.createServer(async (req, res) => {
    await handler.handle(req, res);
});

const serverHandle = server.listen(8080);

process.once('SIGINT', () => serverHandle.close());
process.once('SIGKILL', () => serverHandle.close());