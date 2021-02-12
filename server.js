// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const app = express();
const cheerio = require("cheerio");
const axios = require("axios");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Data = require("./data");
var cors = require("cors");

const API_PORT = 3000;

const router = express.Router();

app.use(cors({ origin: "*" }));

// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// connects our back end code with the database
//console.log(process.env.MONGO_URI)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

let db = mongoose.connection;

db.once("open", () => console.log("connected to database"));

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// this is our create method
// this method creates new user in our database
router.post("/createUser", (req, res) => {
  let data = new Data();
  const { userID } = req.body;
  data.userID = userID;

  data.save(err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

// this method loads user data

router.post("/loadData", (req, res) => {
  const { userID } = req.body;
  return Data.find({ userID: userID }, (err, data) => {
    if (err) res.json({ success: false, error: err });

    if (data.length === 0) {
      let data = new Data();
      data.userID = userID;

      data.save(err => {
        if (err) res.json({ success: false, error: err });
        res.json({ success: true, data: data });
      });
    } else {
      if (data[0].watchlist.ticker.length !== 0) {
        data[0].watchlist.ticker.map(tic => {
          let url = "https://finance.yahoo.com/quote/" + tic;

          axios
            .get(url)
            .then(resp => {
              const $ = cheerio.load("" + resp.data);
              //console.log(resp.data);
              let price = $('div[id="quote-header-info"]')
                .find('span[class="Trsdu(0.3s) Fw(b) Fz(36px) Mb(-4px) D(ib)"]')
                .text()
                .toString();

              console.log("price is:", price);
              data[0].watchlist.price.push(price);
            })
            .catch(err => {
              console.log(err);
            });
        });
      }
      if (data[0].portfolio.ticker.length !== 0) {
        data[0].watchlist.ticker.map(tic => {
          let url = "https://finance.yahoo.com/quote/" + tic;

          axios
            .get(url)
            .then(resp => {
              const $ = cheerio.load("" + resp.data);
              //console.log(resp.data);
              let price = $('div[id="quote-header-info"]')
                .find('span[class="Trsdu(0.3s) Fw(b) Fz(36px) Mb(-4px) D(ib)"]')
                .text()
                .toString();

              console.log("price is:", price);
              data[0].portfolio.price.push(price);
            })
            .catch(err => {
              console.log(err);
            });
        });
      }
      console.log(data[0].watchlist);
      res.json({ success: true, data: data });
    }
  });
});

// this method updated stock watchlist
router.post("/updateWatchlist", (req, res) => {
  const { userID, newWatchlist } = req.body;
  console.log(newWatchlist);

  Data.find({ userID: userID }, (err, data) => {
    Data.findOneAndUpdate(
      { userID: userID },
      { $set: { watchlist: newWatchlist } },
      { new: true },
      (err, data) => {
        if (err) throw err;
        console.log("Data after update: ", data);
        return res.json({ success: true, watchlist: data.watchlist });
      }
    );
  });
});

// this method gets price for a given ticker
router.get("/getPrice/:ticker?", (req, res) => {
  let url = "https://finance.yahoo.com/quote/";
  let ticker = req.params.ticker;
  url = url + ticker;
  console.log(url);

  axios
    .get(url)
    .then(resp => {
      const $ = cheerio.load("" + resp.data);
      //console.log(resp.data);
      let price = $('div[id="quote-header-info"]')
        .find('span[class="Trsdu(0.3s) Fw(b) Fz(36px) Mb(-4px) D(ib)"]')
        .text()
        .toString();

      console.log("price is:", price);
      return res.json({ success: true, price: price });
    })
    .catch(err => {
      console.log(err);
    });
});

// this method buys stock for a given ticker
router.post("/buyTicker", (req, res) => {
  let url = "https://finance.yahoo.com/quote/";
  const { userID, ticker, shares, limitPrice } = req.body;
  url = url + ticker;
  
  
  /*
  axios
    .get(url)
    .then(resp => {
      const $ = cheerio.load("" + resp.data);
      //console.log(resp.data);
      let price = $('div[id="quote-header-info"]')
        .find('span[class="Trsdu(0.3s) Fw(b) Fz(36px) Mb(-4px) D(ib)"]')
        .text()
        .toString();

      price = parseFloat(price);

      if (limitPrice) {
        if (price > limitPrice) {
          return res.json({
            success: false,
            message: `Can not complete transaction! \nStock price $${price} is higher than limit price $${limitPrice}!`
          });
        } else if (shares * price > fund) {
          return res.json({
            success: false,
            message: `Can not complete transaction! \nFunding $${fund} is not sufficient to buy ${shares} shares of ${ticker} at current price of $${price}!`
          });
        } else {
          
        }
      }

      //console.log("price is:", typeof(price));
    })
    .catch(err => {
      console.log(err);
    }); */
});

// append /api for our http requests
app.use("/", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
