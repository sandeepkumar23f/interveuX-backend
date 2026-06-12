import dns from "dns";
import { MongoClient } from "mongodb";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

console.log("DNS:", dns.getServers());

const url =
  "mongodb+srv://interveu-x:interveuX543@cluster0.f2gjwjm.mongodb.net/InterveuX?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(url);

export const connection = async () => {
  try {
    const connect = await client.connect();
    console.log("MongoDB Connected!");
    return connect.db("InterveuX");
  } catch (err) {
    console.error(err);
  }
};