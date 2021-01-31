// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();
const cheerio = require("cheerio");
const axios = require("axios");
var cors = require('cors');


const API_PORT = 3000;

const router = express.Router();

app.use(cors({origin: '*'}));

app.get('/getPrice/:ticker?', (req, res) => {
        let url = 'https://finance.yahoo.com/quote/';
        var ticker = req.params.id;
        url = url + ticker;
        
  axios.get(url)
    .then(res => {
        const $ = cheerio.load(""+res.data);

        let price = $('div[id="quote-header-info"]').find('span[class="Trsdu(0.3s) Fw(b) Fz(36px) Mb(-4px) D(ib)"]').text().toString();

        console.log(price);
        return res.json({success: true, price: price})
    })
    .catch(err => {
        console.log(err);
    })
        })

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));

