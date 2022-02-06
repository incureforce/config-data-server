const crypto = require('crypto');

const { ErrorModel } = require("./Models/ErrorModel");

const key = 'test';
const alg = 'HS256';
const expirationInSeconds = 60 * 10;

const core = {
    encodeToken(user, origin) {
        const unix = unixTimestamp();
        const encodedHeader = Buffer.from(JSON.stringify({
            alg: alg,
            typ: 'JWT'
        }));
        const encodedContent = Buffer.from(JSON.stringify({
            sub: user,
            iss: origin,
            aud: origin,
            iat: unix,
            nbf: unix,
            exp: unix + expirationInSeconds,
            jti: crypto.randomUUID(),
        }));
        const signature = crypto.createHmac('SHA256', key)
            .update(encodedContent)
            .digest('hex');

        return encodedHeader.toString('base64url') + '.' + encodedContent.toString('base64url') + '.' + signature
    },

    decodeToken(token, origin) {
        const [encodedHeader, encodedContent, signature] = token.split('.');

        if (!encodedHeader || !encodedContent || !signature) {
            throw new ErrorModel("E_JWT_TOKEN_INVALID", 401, 'Unauthorized');
        }

        const headerBuffer = Buffer.from(encodedHeader, 'base64');
        const header = JSON.parse(headerBuffer);

        if (header.typ != 'JWT' || header.alg != alg) {
            throw new ErrorModel("E_JWT_TOKEN_INVALID", 401, 'Unauthorized');
        }

        const contentBuffer = Buffer.from(encodedContent, 'base64');

        const clientSignature = Buffer.from(signature, 'hex');
        const serverSignature = crypto.createHmac('SHA256', key)
            .update(contentBuffer)
            .digest();

        if (clientSignature.compare(serverSignature) != 0) {
            throw new ErrorModel("E_JWT_TOKEN_INVALID", 401, 'Unauthorized');
        }
        
        const unix = unixTimestamp();
        const content = JSON.parse(contentBuffer.toString());

        if (content.nbf > unix || content.iat > unix || content.exp < unix || content.aud != origin || content.iss != origin) {
            throw new ErrorModel("E_JWT_TOKEN_INVALID", 401, 'Unauthorized');
        }
        
        return content.sub;
    }
}

module.exports = core;

function unixTimestamp() {
    return Math.floor(Date.now() / 1000);
}
