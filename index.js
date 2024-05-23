const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
require('dotenv').config()

// middleware
const corsOptions = {
  origin: [
    "http://localhost:5173",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())

// ------------ token verify check --------------------
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  // console.log(token);
  if(!token){
    return res.status(401).send({ message: "Unauthorized Access denied" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized Access denied" });
    }
    req.decoded = decoded;
    next();
  });
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const userCollections = client.db("BistroRestaurantDb").collection("users")
    const menuCollections = client.db("BistroRestaurantDb").collection("menu")
    const reviewCollections = client.db("BistroRestaurantDb").collection("reviews")
    const cardCollections = client.db("BistroRestaurantDb").collection("cards")

//  --------------- jwt related api --------------------

app.post("/jwt", async (req, res) => {
  const user = req.body;
  try {
    const token = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    }).send({ success: true, token });
  } catch (error) {
    res.status(500).send({ message: "Error generating token", error });
  }
});



// ------------------ users related data ----------------

    // ---------------- post users data ----------------

    app.post("/users", async (req, res) => {
        const user = req.body;
        const result = await userCollections.insertOne(user);
        res.send(result);
    })
    // ----------------- delete a user ------------------------
    app.delete("/users/:id", async (req,res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollections.deleteOne(query);
      res.send(result);
    })
    // ----------------- get all users ----------------
    app.get("/users",verifyToken, async (req, res) => {
      // console.log(req.headers);
        const result = await userCollections.find().toArray();
        res.send(result);
    })
    // --------------- get admin ------------------------
    app.get("/users/admin/:email",verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(req.decoded.email);
      if(email !== req.decoded.email){
        return res.status(401).send({ message: "Unauthorized Access denied" });
      }
      const query = {email: email};
      const user = await userCollections.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === "admin";
      }
      res.send({admin});


    })
    // --------------- make a user admin ---------------
    app.patch("/users/admin/:id", async (req,res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc ={
        $set:{
          role: "admin"
        }
      }
      const result = await userCollections.updateOne(filter, updatedDoc);
      res.send(result);
    })
    // ----------------- delete a user by email ----------------


//  ------------------------  reviews related data --------------------

// ----------------- get all reviews ----------------
app.get("/reviews", async (req, res) => {
    const result = await reviewCollections.find().toArray();
    res.send(result);





    // ----------- menus related data --------------------
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
        const email = req.query.email;
        const query = {email: email};
        const result = await cardCollections.find(query).toArray();
        res.send(result);
    })

    // ---------------- delete a card by email --------------
    app.delete("/cards/:id", async (req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await cardCollections.deleteOne(query);
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