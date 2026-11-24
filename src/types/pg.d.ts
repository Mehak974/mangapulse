declare module 'pg' {
  export interface QueryResultRow {
    [column: string]: any;
  }

  export interface QueryResult<R extends QueryResultRow = any> {
    rows: R[];
    command: string;
    rowCount: number;
    oid: number;
    fields: any[];
  }

  export class Pool {
    constructor(config?: any);
    connect(): Promise<any>;
    query<R extends QueryResultRow = any>(queryText: string, values?: any[]): Promise<QueryResult<R>>;
    end(): Promise<void>;
  }

  export class Client {
    constructor(config?: any);
    connect(): Promise<void>;
    query<R extends QueryResultRow = any>(queryText: string, values?: any[]): Promise<QueryResult<R>>;
    end(): Promise<void>;
  }
}
