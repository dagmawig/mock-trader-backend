// /backend/data.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// this will be our database's data structure 
const DataSchema = new Schema(
  {
    userID: { type: String, default: "" },
    watchlist: { type: Object, default: {ticker: [], price: []} },
    fund: 10000.00,
    portfolio: {type: Schema.Types.Mixed, default: {}}
  },
  { timestamps: true, _id: true, minimize: false, strict: false }
);

// export the new Schema so we could modify it using Node.js
module.exports = mongoose.model("Data", DataSchema);