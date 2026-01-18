const fs = require('fs');
function log(msg) { fs.appendFileSync('server_startup.log', msg + '\n'); }
log('Top of file');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3003;
// when using middleware `hostname` and `port` must be provided below
log('Initializing next app...');
const app = next({ dev, hostname, port });
log('Getting request handler...');
const handle = app.getRequestHandler();

log('Preparing app...');
app.prepare().then(() => {
    log('App prepared!');
    createServer(async (req, res) => {
        try {
            // Be sure to pass `true` as the second argument to `url.parse`.
            // This tells it to parse the query portion of the URL.
            const parsedUrl = parse(req.url, true);
            const { pathname, query } = parsedUrl;

            if (pathname === '/a') {
                await app.render(req, res, '/a', query);
            } else if (pathname === '/b') {
                await app.render(req, res, '/b', query);
            } else {
                await handle(req, res, parsedUrl);
            }
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    })
        .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            log(`> Ready on http://${hostname}:${port}`);
        });
}).catch(err => {
    log(`Error preparing app: ${err}`);
    process.exit(1);
});
