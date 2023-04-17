import express, { json } from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import joi from 'joi';

const server = express();

// configs
server.use(cors());
server.use(express.json());
dotenv.config();

// connecting to MongoDB database
const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db

mongoClient.connect().then(() => db = mongoClient.db())

//GET participants 

server.get('/participants', (req, res) => {
    db.collection("participants").find().toArray()
    .then((participants) => res.send(participants))
    .catch(err => res.status(500).send(err.message))

});

//POST participants when entering

server.post('/participants', async (req, res) => {
    const { name } = req.body;

    const userSchema = joi.object({
      name: joi.string().required()
    });

    const validation = userSchema.validate(req.body, { abortEarly: false });
    
    if(validation.error) {
      console.log(validation.error.details)
      return res.status(422).send("Escreva seu nome de usuário corretamente")
    }

    const existingUser = await db.collection("participants").findOne({ name: name })

    if (existingUser) {
       return res.status(409).send("Nome de usuário já utilizado.");
      }
        
   try { 
      const newUser = {name: name, lastStatus: Date.now()};
      const newMessage = { 
      from: name,
      to: 'Todos',
      text: 'entra na sala...',
      type: 'status',
      time: dayjs().format("HH:mm:ss")
      };
      await db.collection("participants").insertOne(newUser)
      await db.collection("messages").insertOne(newMessage)
      res.sendStatus(201)
    } catch {
      res.sendStatus(500);
    }
  })

  //GET messages from the database

  server.get("/messages", async (req, res) => {
    const { user } = req.headers;
    const limit = parseInt(req.query.limit) 

    const messages = await db.collection('messages').find({
      $or: [
        { to: 'Todos' },
        { to: user },
        { from: user }
      ]}).toArray()
      if (!limit) {
        res.send(messages);
      } else {
        const limitSchema = joi.object({
          limit: joi.number().integer().positive()
        })
        const validation = limitSchema.validate(limit, { abortEarly: false })
        if (validation.error) {
          return res.sendStatus(422)
        } else {
          res.send(messages.slice(-limit));
        }
      }
  })

  //POST message from the user

  server.post("/messages", async (req, res) => {
    const { to, type, text } = req.body;
    const { user } = req.headers;

    const existingUser = await db.collection("participants").findOne({ name: user })

    if (!existingUser) {
        return res.status(422).send("O remetente não está na lista de participantes.")
    }

    const messageSchema = joi.object({
      to: joi.string().required(),
      text: joi.string().required(),
      type: joi.string().required().valid("message", "private_message"),
    });

    const validation = messageSchema.validate(req.body, { abortEarly: false })

    if (validation.error) {
      console.log(validation.error.details);
      return res.status(422).send("Preencha corretamente a mensagem.")
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