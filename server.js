// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();
var cors = require('cors');

const API_PORT = 3000;

const router = express.Router();

app.use(cors({origin: '*'}));

app.get('/getPrice/:ticker?', (req, res) => {
        var ticker = req.params.id;
        
        })
// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
