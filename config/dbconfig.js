import { MongoClient } from "mongodb";

const url = "mongodb+srv://interveu-x:interveuX543@cluster0.f2gjwjm.mongodb.net/InterveuX?retryWrites=true&w=majority&appName=Cluster0";

const dbName = "InterveuX";

const client = new MongoClient(url);

export const connection = async () => {
  const connect = await client.connect();
  console.log("MongoDB Connected!");
  return connect.db(dbName);
};
