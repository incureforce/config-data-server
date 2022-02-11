const http = require("http");

const ENV = require("./app-env")
const handler = require("./app-handler");

const server = http.createServer(async (req, res) => {
    await handler.handle(req, res);
});

const serverHandle = server.listen(ENV.port);

process.once('SIGTERM', () => serverHandle.close());
process.once('SIGINT', () => serverHandle.close());