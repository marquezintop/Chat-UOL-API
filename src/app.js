import express, { json } from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import dayjs from 'dayjs';

const server = express();

// configs
server.use(cors());
server.use(json());
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db

mongoClient.connect().then(() => db = mongoClient.db())

server.get('/participants', (req, res) => {
    db.collection("participants").find().toArray()
    .then((participants) => res.send(participants))
    .catch(err => res.status(500).send(err.message))

});

server.post('/participants', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(422).send("Todos os campos devem ser devidamente preenchidos.")
    } 

    const existingUser = await db.collection("participants").findOne({ name: name })

    if (existingUser) {
        res.status(409).send("Nome de usuário já utilizado.");
      }
        
    const newUser = {name: name, lastStatus: Date.now()};
    db.collection("participants").insertOne(newUser)
    .then(() => console.log("Deu certo!"))
    .catch((err) => res.status(500).send(err.message))

    const newMessage = { 
		from: name,
		to: 'Todos',
		text: 'entra na sala...',
		type: 'status',
		time: dayjs().format("HH:mm:ss")
    };
    db.collection("messages").insertOne(newMessage)
    .then(() => console.log("Deu certo dnv!"))
    .catch((err) => res.status(500).send(err.message))

    res.sendStatus(201)
  })

  server.get("/messages", async (req, res) => {
    const { user } = req.headers;
    const limit = parseInt(req.query.limit);

    const messages = await db.collection('messages').find({
        $or: [
          { to: 'Todos' },
          { to: user },
          { from: user }
        ]}).toArray();

    res.send(messages)
  })

  server.post("/messages", async (req, res) => {
    const { to, type, text } = req.body;
    const { user } = req.headers;

    const existingUser = await db.collection("participants").findOne({ name: user })

    if (!existingUser) {
        return res.status(422).send("O remetente não está na lista de participantes.")
    }

    if (!to || !text) {
        return res.status(422).send("Preencha corretamenta todos os campos.")
    }

    if (type != "message" && type != "private_message") {
        return res.status(422).send("As mensagens devem ser apenas de dois tipos, message ou private_message.")
    }

    const newMessage = {
        from: user,
		to: to,
		text: text,
		type: type,
		time: dayjs().format("HH:mm:ss")
    }
    db.collection("messages").insertOne(newMessage)

    res.sendStatus(201)
  })

server.listen(5000, () => {
  console.log("Rodando em http://localhost:5000");
});