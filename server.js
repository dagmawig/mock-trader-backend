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

router.get("/getPrice/:ticker?", (req, res) => {
  let url = "https://finance.yahoo.com/quote/";
  var ticker = req.params.ticker;
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

router.post("/updatePrice", (req, res) => {
  console.log("it got to update!!!");
  let url = "https://finance.yahoo.com/quote/";
  const { tickerArr } = req.body;
  let data = { ticker: tickerArr, price: [] };

   function updatePrice(tickerArr){
  return Promise.all(tickerArr.map(fetchPrice));
}     
  function fetchPrice(ticker) {
  return axios
    .get(url+ticker)
    .then(function(response) {
      return {
        success: true,
        data: response.data
      };
    })
    .catch(function(error) {
      return { success: false };
    });
}
      
        axios
        .get(url)
        .then(resp => {
          const $ = cheerio.load("" + resp.data);
          let price = $('div[id="quote-header-info"]')
            .find('span[class="Trsdu(0.3s) Fw(b) Fz(36px) Mb(-4px) D(ib)"]')
            .text()
            .toString();

          console.log("price is:", price);
        })
        .catch(err => {
          console.log(err);
        });
    
        
  return null;

  // updatePrice().then(res => {
  //   console.log("data is:", data);
  //   return res.json({ success: true, data: data });
  // });

  //return res.json({ success: true, data: priceArr });
});

// append /api for our http requests
app.use("/", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
