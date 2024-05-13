const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// middle were
const logger = async (req, res, next) => {
    console.log('called', req.hostname, req.originalUrl)
    next()
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(404).send({ message: 'Not Authorized' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(401).send({ message: 'Unauthorized' })
        }
        req.user = decoded;
        next()
    })
}



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

        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.
                cookie('token', token, {
                    httpOnly: true,
                    secure: false
                }).send({ success: true })
        })


        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })


        app.get('/foods', logger, async (req, res) => {
            const result = await foodCollection.find().toArray()
            res.send(result);
        })

        app.delete('/foods', logger, async (req, res) => {
            const id = req.query.id;
            console.log(id)
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.deleteOne(query)
            res.send(result)
        })

        app.get('/food/:id', logger, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await foodCollection.findOne(query)
            res.send(result)
        })

        app.post('/foods', logger, async (req, res) => {
            const food = req.body;
            const result = await foodCollection.insertOne(food);
            res.send(result)
        })

        app.post('/requestedFoods', logger, async (req, res) => {
            const food = req.body;
            const result = await requestCollection.insertOne(food)
            res.send(result)
        })

        app.get('/requestedFood', logger, verifyToken, async (req, res) => {
            const email = req.query.email;

            if (req.query.email !== req.user.userEmail) {
                return res.status(403).send({ message: 'forbidden' })
            }
            const query = { userEmail: email }
            const result = await requestCollection.find(query).toArray()
            res.send(result)
        })

        app.patch('/foods', logger, async (req, res) => {
            const updatedData = req.body;
            const id = updatedData.id;
            const filter = { _id: new ObjectId(id) }

            const food = {
                $set: {
                    foodStatus: 'requested'
                }
            }
            const result = await foodCollection.updateOne(filter, food)
            res.send(result)
        })

        app.get('/food', logger, verifyToken, async (req, res) => {
            const email = req.query.email;
            console.log(req.query.email, req.user.userEmail)

            if (req.query.email !== req.user.userEmail) {
                return res.status(403).send({ message: 'forbidden' })
            }
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