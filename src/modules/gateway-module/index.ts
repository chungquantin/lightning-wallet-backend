import { buildGateway } from "./gateway";
import { collectDefaultMetrics } from "prom-client";

console.log("Server boots up!");

collectDefaultMetrics();

buildGateway().catch((err: any) => console.log(err));
