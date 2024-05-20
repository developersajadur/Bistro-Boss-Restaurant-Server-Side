const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config()

// middleware

app.use(cors());
app.use(express.json());










const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@bistro-boss-restaurant.ou0pbww.mongodb.net/?retryWrites=true&w=majority&appName=Bistro-Boss-Restaurant`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // ----------------- database collections ----------------
    const menuCollections = client.db("BistroRestaurantDb").collection("menu")
    const reviewCollections = client.db("BistroRestaurantDb").collection("reviews")
    const cardCollections = client.db("BistroRestaurantDb").collection("cards")



// ----------------- get all reviews ----------------
app.get("/reviews", async (req, res) => {
    const result = await reviewCollections.find().toArray();
    res.send(result);
})
    // ------------ get all menus ----------------
    app.get("/menus", async (req, res) => {
        const result = await menuCollections.find().toArray();
        res.send(result);
    })

    // -------------- insert a card data -----------------
    app.post("/cards", async (req, res) => {
        const card = req.body;
        const result = await cardCollections.insertOne(card);
        res.json(result);
    })
    // ----------------- get all by email cards ----------------
    app.get("/cards", async (req, res) => {
        const email = req.body.email;
        const query = {email: email};
        const result = await cardCollections.find(query).toArray();
        res.send(result);
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send("Restaurant Server Is Running");
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})