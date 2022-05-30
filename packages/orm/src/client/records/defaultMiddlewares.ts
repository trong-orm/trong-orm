import { QueryExecResult } from "@harika-org/sql.js";
import { runQuery } from "../runQueries";
import { generateInsert } from "../sqlHelpers";
import { runInTransaction } from "../transaction";
import { IDbState } from "../types";
import { chunk } from "../utils";
import {
  buildMiddleware,
  ICreateRecordAction,
  IGetAction,
} from "./middlewares";

export const insertRecordsMiddleware = buildMiddleware(<
  _Row extends Record<string, any> & { id: string },
  Rec extends Record<string, any> & { id: string }
>() => async (dbState, recordConfig, actions, result, next) => {
  const createActions = actions.filter(
    (ac) => ac.type === "create"
  ) as ICreateRecordAction<Rec>[];

  for (const action of createActions) {
    // sqlite max vars = 32766
    // Let's take table columns count to 20, so 20 * 1000 will fit the restriction
    const chunked = chunk(action.records, 1000);

    const toExec = async (state: IDbState) => {
      for (const records of chunk(action.records, 1000)) {
        // TODO: maybe runQueries? But then a large object will need to be transferred, that may cause freeze
        await runQuery(
          state,
          generateInsert(
            recordConfig.table,
            records.map((r) => recordConfig.serialize(r)),
            action.replace
          )
        );
      }
    };

    await (chunked.length > 1
      ? runInTransaction(dbState, toExec)
      : toExec(dbState));
  }

  return await next(dbState, recordConfig, actions, result);
});

const mapToRows = <T extends Record<string, any>>(result: QueryExecResult) => {
  return (result?.values?.map((res) => {
    let obj: Record<string, any> = {};

    result.columns.forEach((col, i) => {
      obj[col] = res[i];
    });

    return obj;
  }) || []) as T[];
};

export const selectRecordsMiddleware = buildMiddleware(<
  Row extends Record<string, any> & { id: string },
  Rec extends Record<string, any> & { id: string }
>() => async (dbState, recordConfig, actions, _result, next) => {
  const getActions = actions.filter((ac) => ac.type === "get") as IGetAction[];

  const resultRecords: Rec[] = [];

  for (const action of getActions) {
    const [result] = await runQuery(dbState, action.query);

    resultRecords.push(
      ...mapToRows<Row>(result).map(
        (row) => recordConfig.deserialize(row) as Rec
      )
    );
  }

  return await next(dbState, recordConfig, actions, resultRecords);
});
