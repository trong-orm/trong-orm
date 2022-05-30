import { IDbState } from "../types";
import { IRecordConfig } from "./defineRecord";

export type ICreateRecordAction<
  Rec extends Record<string, any> & { id: string }
> = { type: "create"; records: Rec[]; replace: boolean };

export type IUpdateRecordAction<
  Rec extends Record<string, any> & { id: string }
> = { type: "update"; partialRecords: (Partial<Rec> & { id: string })[] };

export type IDeleteRecordAction = { type: "delete"; ids: string[] };

export type IRecAction<Rec extends Record<string, any> & { id: string }> =
  | ICreateRecordAction<Rec>
  | IUpdateRecordAction<Rec>
  | IDeleteRecordAction;

export type INextMiddleware<
  Row extends Record<string, any> & { id: string },
  Rec extends Record<string, any> & { id: string }
> = (
  dbState: IDbState,
  recordConfig: IRecordConfig<Row, Rec>,
  actions: IRecAction<Rec>[]
) => Promise<{
  dbState: IDbState;
  recordConfig: IRecordConfig<Row, Rec>;
  actions: IRecAction<Rec>[];
}>;

export type IMiddleware<
  Row extends Record<string, any> & { id: string },
  Rec extends Record<string, any> & { id: string }
> = (
  dbState: IDbState,
  recordConfig: IRecordConfig<Row, Rec>,
  actions: IRecAction<Rec>[],
  next: INextMiddleware<Row, Rec>
) => Promise<{
  dbState: IDbState;
  recordConfig: IRecordConfig<Row, Rec>;
  actions: IRecAction<Rec>[];
}>;

export const buildMiddleware = <
  Row extends Record<string, any> & { id: string },
  Rec extends Record<string, any> & { id: string }
>(
  builder: () => IMiddleware<Row, Rec>
) => builder();

export const applyAction = async <
  Row extends Record<string, any> & { id: string },
  Rec extends Record<string, any> & { id: string }
>(
  dbState: IDbState,
  recordConfig: IRecordConfig<Row, Rec>,
  actions: IRecAction<Rec>[]
) => {
  const middlewares = recordConfig.middlewares.slice();
  middlewares.reverse();

  const emptyMiddleware: INextMiddleware<Row, Rec> = async (
    dbState,
    recordConfig,
    actions
  ) => ({ recordConfig, dbState, actions });

  let toCall: INextMiddleware<Row, Rec> = emptyMiddleware;

  for (const middleware of middlewares) {
    const currentCall = toCall;

    toCall = (
      dbState: IDbState,
      recordConfig: IRecordConfig<Row, Rec>,
      actions: IRecAction<Rec>[]
    ) => middleware(dbState, recordConfig, actions, currentCall);
  }

  await toCall(dbState, recordConfig, actions);
};
