import "reflect-metadata";
import { Container } from "typedi";
import { useContainer } from "typeorm";
import * as Server from "./server";
import "dotenv/config";

useContainer(Container);

Server.listen(3001).then(() =>
  console.log("Account Service boots successfully")
);
