import { buildGateway } from "./gateway";
import { collectDefaultMetrics } from "prom-client";
import { useContainer } from 'typeorm'
import { Container } from 'typedi'
console.log("Server boots up!");

collectDefaultMetrics();

useContainer(Container)

buildGateway().catch(err => console.log(err));
