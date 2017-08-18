const express = require('express');
const cache = require('memory-cache');
const request = require('request');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const port = process.env.PORT || 3333;
const app = express();

app.enable('trust proxy');
app.disable('x-powered-by');

const auth = new Buffer(`${client_id}:${client_secret}`).toString('base64');

const options = {
  url: 'https://accounts.spotify.com/api/token',
  json: true,
  form: { grant_type: 'client_credentials' },
  headers: { Authorization: `Basic ${auth}` },
};

function getToken(callback) {
  if (cache.get('token') && cache.get('expires')) {
    return callback({
      err: null,
      expires: cache.get('expires'),
      token: cache.get('token'),
    });
  }

  request.post(options, (err, res, body) => {
    if (err) {
      return callback({ err });
    }
    if (res.statusCode !== 200) {
      return callback({
        err: {
          code: res.statusCode,
          message: res.body.error,
        }
      });
    }

    const token = body.access_token;
    const expires_in = (body.expires_in - 60) * 1000;
    const expires = Date.now() + expires_in;

    cache.put('token', token, expires_in);
    cache.put('expires', expires, expires_in);

    return callback({
      err: null,
      expires,
      token,
    });
  });
}

app.get('/', (req, res) => {
  getToken(data => res.json(data));
});

app.listen(port, () => console.log('App is listening on port %s', port));
