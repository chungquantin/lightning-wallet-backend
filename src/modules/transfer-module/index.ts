import { Container } from "typedi";
import { useContainer } from "typeorm";
import * as Server from "./server";

useContainer(Container);

Server.listen(3004).then(() =>
  console.log("Transfer Service boots successfully")
);
