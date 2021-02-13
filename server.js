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

mongoose.set("useFindAndModify", false);

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

// this method formats stock price to two decimal deigits
function formatNum(x) {
  x = parseFloat(x);
  x = x.toFixed(2);
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//this method fetches price

async function fetchPrice(ticker) {
  let url = "https://finance.yahoo.com/quote/" + ticker;

  let res = axios
    .get(url)
    .then(resp => {
      const $ = cheerio.load("" + resp.data);
      //console.log(resp.data);
      let price = $('div[id="quote-header-info"]')
        .find('span[class="Trsdu(0.3s) Fw(b) Fz(36px) Mb(-4px) D(ib)"]')
        .text()
        .toString();

      console.log("fetch price is:", price);
      return price;
    })
    .catch(err => {
      console.log(err);
    });
  return res;
}

// this methos return array of prices given array of tickers
async function fetchPArray(arr) {
  let res = await arr.map(tic => {
    return fetchPrice(tic);
    //return tic+"l";
  });
  
  return res;
}

// fetchPrice("BA").then(data=> {
//   console.log("data is ", data);
// });

fetchPArray(["BA", "TSLA"]).then(resp=> {
  console.log(resp);
  Promise.all(resp). then(val => {
    console.log(val);
  })

})


  


// this method loads user data

router.post("/loadData", (req, res) => {
  const { userID } = req.body;
  return Data.find({ userID: userID }, (err, data) => {
    if (err) res.json({ success: false, error: err });

    if (data.length === 0) {
      let data = new Data();
      data.userID = userID;
      console.log("new data", data);
      data.save(err => {
        if (err) res.json({ success: false, error: err });
        res.json({ success: true, data: [data] });
      });
    } else {
      let pSize = data[0].portfolio.ticker.length;
      let wSize = data[0].watchlist.ticker.length;
      
      let ticArr = data[0].portfolio.ticker.concat(data[0].watchlist.ticker);
      
      fetch
//       async function getPrices() {
//         if (data[0].watchlist.ticker.length !== 0) {
//           var wPrices = await data[0].watchlist.ticker.map(tic => {
//             fetchPrice(tic).then(price => {
//               console.log("watch price is:", price);
//               data[0].watchlist.price.push(price);
//               return price;
//             });
//           });
//         }

//         if (data[0].watchlist.ticker.length !== 0) {
//           var pPrices = await data[0].portfolio.ticker.map(tic => {
//             fetchPrice(tic).then(price => {
//               console.log("port price is:", price);
//               data[0].portfolio.price.push(price);
//               return price;
//             });
//           });
//         }
//         return { w: wPrices, p: pPrices };
//       }

//       getPrices().then(response => {
//         console.log("resp format", response)
        
//       });
    }
    return res.json({success: true, data: data})
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
        //console.log("Data after update: ", data);
        return res.json({ success: true, watchlist: data.watchlist });
      }
    );
  });
});

// this method gets price for a given ticker
router.get("/getPrice/:ticker?", (req, res) => {
  let url = "https://finance.yahoo.com/quote/";
  let ticker = req.params.ticker;

  fetchPrice(ticker).then(price => {
    console.log("f price is", price);
    return res.json({ success: true, price: price });
  });
});

// this method buys stock for a given ticker
router.post("/buyTicker", (req, res) => {
  const { userID, ticker } = req.body;

  Data.find({ userID: userID }, (err, data) => {
    let fund = data[0].fund;

    fetchPrice(ticker).then(price => {
      let p = parseFloat(price.replace(",", ""));

      const { userID, ticker, shares, limitPrice } = req.body;

      if (limitPrice) {
        if (p > limitPrice) {
          return res.json({
            success: false,
            message: `Can not complete transaction! \nStock price $${price} is higher than limit price $${formatNum(
              limitPrice
            )}!`
          });
        } else if (shares * p > fund) {
          return res.json({
            success: false,
            message: `Can not complete transaction! \nFunding $${formatNum(
              fund
            )} is not sufficient to buy ${shares} shares of ${ticker} at current price of $${price}!`
          });
        } else {
          fund = fund - shares * p;
          let portfolio = data[0].portfolio;

          if (!portfolio.ticker.includes(ticker.toUpperCase())) {
            portfolio.ticker.push(ticker.toUpperCase());
            portfolio.shares.push(shares);
            portfolio.averageC.push(price);
            let message = `Success! ${shares} shares of ${ticker.toUpperCase()} bought at a price of ${price}!`;
            Data.findOneAndUpdate(
              { userID: userID },
              { $set: { portfolio: portfolio } },
              { new: true },
              (err, data) => {
                if (err) throw err;
                return res.json({
                  success: true,
                  data: { data: data, message: message }
                });
              }
            );
          } else {
            let index = portfolio.ticker.indexOf(ticker.toUpperCase());
            let newShares = portfolio.shares[index] + shares;
            let cost =
              (portfolio.shares[index] * portfolio.averageC[index] +
                shares * p) /
              newShares;
            portfolio.shares[index] = newShares;
            portfolio.averageC[index] = cost;
            let message = `Success! ${shares} shares of ${ticker.toUpperCase()} bought at a price of ${price}!`;
            Data.findOneAndUpdate(
              { userID: userID },
              { $set: { portfolio: portfolio } },
              { new: true },
              (err, data) => {
                if (err) throw err;
                return res.json({
                  success: true,
                  data: { data: data, message: message }
                });
              }
            );
          }
        }
      } else {
        if (shares * p > fund) {
          return res.json({
            success: false,
            message: `Can not complete transaction! \nFunding $${formatNum(
              fund
            )} is not sufficient to buy ${shares} shares of ${ticker} at current price of $${price}!`
          });
        } else {
          fund = fund - shares * p;
          let portfolio = data[0].portfolio;

          if (!portfolio.ticker.includes(ticker.toUpperCase())) {
            portfolio.ticker.push(ticker.toUpperCase());
            portfolio.shares.push(shares);
            portfolio.averageC.push(price);
            let message = `Success! ${shares} shares of ${ticker.toUpperCase()} bought at a price of ${price}!`;
            Data.findOneAndUpdate(
              { userID: userID },
              { $set: { portfolio: portfolio } },
              { new: true },
              (err, data) => {
                if (err) throw err;
                return res.json({
                  success: true,
                  data: { data: data, message: message }
                });
              }
            );
          } else {
            let index = portfolio.ticker.indexOf(ticker.toUpperCase());
            let newShares = portfolio.shares[index] + shares;
            let cost =
              (portfolio.shares[index] * portfolio.averageC[index] +
                shares * p) /
              newShares;
            portfolio.shares[index] = newShares;
            portfolio.averageC[index] = cost;
            let message = `Success! ${shares} shares of ${ticker.toUpperCase()} bought at a price of ${price}!`;
            Data.findOneAndUpdate(
              { userID: userID },
              { $set: { portfolio: portfolio } },
              { new: true },
              (err, data) => {
                if (err) throw err;
                return res.json({
                  success: true,
                  data: { data: data, message: message }
                });
              }
            );
          }
        }
      }
    });
  });
});

// append /api for our http requests
app.use("/", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
