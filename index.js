const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oeipnk8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // await client.connect();
        // Send a ping to confirm a successful connection

        const foodCollection = client.db('foodUnity').collection('foods');
        const requestCollection = client.db('foodUnity').collection('requestedFood')

        app.get('/foods', async (req, res) => {
            const result = await foodCollection.find().toArray()
            res.send(result);
        })

        app.get('/food/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await foodCollection.findOne(query)
            res.send(result)
        })

        app.post('/foods', async (req, res) => {
            const food = req.body;
            const result = await foodCollection.insertOne(food);
            res.send(result)
        })

        app.post('/requestedFoods', async (req, res) => {
            const food = req.body;
            const result = await requestCollection.insertOne(food)
            res.send(result)
        })

        app.patch('/foods', async (req, res) => {
            const updatedData = req.body;
            const id = updatedData.id;
            const filter = { _id: new ObjectId(id) }

            const food = {
                $set: {
                    foodStatus: 'Not available'
                }
            }
            const result = await foodCollection.updateOne(filter, food)
            res.send(result)
        })

        app.get('/food', async (req, res) => {
            const email = req.query.email;
            const query = { donarEmail: email }
            const result = await foodCollection.find(query).toArray()
            res.send(result)
        })


        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('server is running ......')
})

app.listen(port, () => {
    console.log(`server is running on port : ${port}`)
})