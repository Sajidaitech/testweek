var express = require("express");
var app = express();

// Logger middleware to log request method, URL, and IP address
app.use(function (req, res, next) {
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  next();
});

// CORS middleware to allow cross-origin requests
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,POST,PUT,DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());


// Function to log the current time
function logCurrentTime() {
  const time = new Date();
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };

  return time.toLocaleDateString("en-US", options);
}


const MongoClient = require('mongodb').MongoClient;
let db;

MongoClient.connect(
  "mongodb+srv://sajidteech:Qatar2024@mongo.ovhek.mongodb.net/",
  (err, client) => {
    if (err) {
      console.error("Failed to connect to MongoDB:", err);
      process.exit(1);
    }
    db = client.db("webstore");
    console.log("Connected to MongoDB");
  }
);

app.get("/", (req, res) => {
  res.send("Select a collection, e.g., /collection/messages");
});

app.param("collectionName", (req, res, next, collectionName) => {
  req.collection = db.collection(collectionName);
  return next();
});

app.get("/collection/:collectionName", (req, res, next) => {
  req.collection.find({}).toArray((e, results) => {
    if (e) return next(e);
    res.send(results);
  });
});

app.post("/collection/:collectionName", (req, res, next) => {
  req.collection.insertOne(req.body, (e, result) => {
    if (e) return next(e);
    res.send(result.ops[0]);
  });
});

app.get("/collection/:collectionName/:id", (req, res, next) => {
  req.collection.findOne({ _id: new ObjectID(req.params.id) }, (e, result) => {
    if (e) return next(e);
    res.send(result);
  });
});

app.put("/collection/:collectionName/:id", (req, res, next) => {
  req.collection.updateOne(
    { _id: new ObjectID(req.params.id) },
    { $set: req.body },
    { safe: true },
    (e, result) => {
      if (e) return next(e);
      res.send(result.matchedCount === 1 ? { msg: "success" } : { msg: "error" });
    }
  );
});

app.delete("/collection/:collectionName/:id", (req, res, next) => {
  req.collection.deleteOne({ _id: new ObjectID(req.params.id) }, (e, result) => {
    if (e) return next(e);
    res.send(result.deletedCount === 1 ? { msg: "success" } : { msg: "error" });
  });
});

app.post("/place-order", (req, res) => {
  const ordersCollection = db.collection("orders");
  const order = req.body;

  if (
    !order.firstName ||
    !order.lastName ||
    !order.address ||
    !order.city ||
    !order.state ||
    !order.zip ||
    !order.phone ||
    !order.cart ||
    order.cart.length === 0
  ) {
    return res.status(400).send({ msg: "Invalid order data" });
  }

  order.date = new Date();

  ordersCollection.insertOne(order, (err, result) => {
    if (err) {
      console.error("Error placing order:", err);
      return res.status(500).send({ msg: "Failed to place order" });
    }
    res.send({ msg: "Order placed successfully", orderId: result.insertedId });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
