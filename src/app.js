import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();

app.use(cors());
app.use(express.json());

let db;
const mongoClient = new MongoClient("mongodb://localhost:27017/dbmarvel");
db = mongoClient.db()


app.get("/viloes", (req,res) => {
    db.collection("viloes").find().toArray()
    .then(viloes => res.send(viloes))
    .catch(err => res.status(500).send(err.message))
})

const PORT = 5000;
app.listen(PORT, () => (console.log(`Servidor funcionando na porta: ${PORT}`)))