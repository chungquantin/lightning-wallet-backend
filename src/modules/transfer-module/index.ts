import { Container } from "typedi";
import { useContainer } from "typeorm";
import * as Server from "./server";
import { lightningUtil } from "./utils";

useContainer(Container);

// console.log(
//   lightningUtil.decode(
//     "lntb1psk3c7zpp535alj7ypkxx4ykud2y9mxwd9g9zm7h930m58l5xsax0szjahghrqdq9fpjhjcqzpgxqzuysp5yseepsfl6fcnlh5eqvrt5dqxtueaweu0flf6vpmnsqks8rr8vess9qyyssq58skr6hag4ladl384wv70ndw2y7hrp0u7cayfs4q4nh75yx0r4p4729t3dafshttnas0s4lt7d0etzapln4nevpe2jdy3ufc74x2ekcq7pvxcm"
//   )
// );

Server.listen(3004).then(() =>
  console.log("Transfer Service boots successfully")
);
