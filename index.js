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

// ------------ token verify check --------------------
const verifyToken = (req, res, next) => {
  const token = req?.headers?.authorization;
  if(!token){
    return res.status(401).send({ message: "Unauthorized Access denied 1" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized Access denied 2" });
    }
    req.decoded = decoded;
    next();
  });
}
// -------------- verify admin after verifyToken ------------

const verifyAdmin = async (req, res, next) => {
  const email = req?.decoded?.email;
  const query = {email: email};
  const user = await userCollections.findOne(query);
  const isAdmin = user?.role === "Admin";
  if(!isAdmin){
    return res.status(403).send({ message: "Unauthorized Access denied" });
  }
  next();
}



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
    app.get("/users",verifyToken, verifyAdmin, async (req, res) => {
      // console.log(req.headers);
        const result = await userCollections.find().toArray();
        res.send(result);
    })
    // --------------- get admin ------------------------
    app.get("/users/admin/:email",verifyToken,verifyAdmin, async (req, res) => {
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(401).send({ message: "Unauthorized Access denied" });
      }
      const query = {email: email};
      const user = await userCollections.findOne(query);
      let isAdmin = false;
      if(user?.role){
        isAdmin = user?.role === "Admin";
      }
      res.send({isAdmin});


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

})

    // ----------- menus related data --------------------

    // ------------- add a menu item -------------
    app.post("/menus", verifyToken, verifyAdmin, async (req,res) => {
      const menu = req.body;
      const result = await menuCollections.insertOne(menu);
      res.send(result);
    })
    // ------------ get all menus ----------------
    app.get("/menus", async (req, res) => {
        const result = await menuCollections.find().toArray();
        res.send(result);
    })
    // ------------- get a menu ----------------
    app.get("/menus/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menuCollections.findOne(query);
      res.send(result);
    })
    // ---------------- update a menu item ----------------
    app.patch("/menus/:id", verifyToken, verifyAdmin, async (req,res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc ={
        $set:{
          name: item.name,
          category: item.category,
          image: item.image,
          price: item.price,
          recipe: item.recipe,
        }
      }
      const result = await menuCollections.updateOne(filter, updatedDoc);
      res.send(result);
    })
    // ----------------- delete a menu item ----------------
    app.delete("/menus/:id", verifyToken, verifyAdmin, async (req,res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menuCollections.deleteOne(query);
      res.send(result);
    })
    // ----------------- update a menu item ----------------
    // app.patch("/menus/:id", verifyToken, verifyAdmin, async (req,res) => {
    //   const id = req.params.id;
    //   const filter = {_id: new ObjectId(id)};
    //   const updatedDoc ={
    //     $set: req.body
    //   }
    //   const result = await menuCollections.updateOne(filter, updatedDoc);
    //   res.send(result);
    // })

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