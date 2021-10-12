import { Connection } from "typeorm";
import { genORMConnection } from "../helpers/orm.config";

let conn: Connection | null = null;
export const testFrame = (cb: Function) => {
  beforeAll(async () => {
    conn = await genORMConnection({ logging: false });
  });

  cb();

  afterAll(async () => {
    await conn?.close();
  });
};
function afterAll(arg0: () => Promise<void>) {
  throw new Error("Function not implemented.");
}

function beforeAll(arg0: () => Promise<void>) {
  throw new Error("Function not implemented.");
}
