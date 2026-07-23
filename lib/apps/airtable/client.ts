/**
 * @deprecated Stub for the deleted Airtable client.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const AirtableClient = class {
  constructor(_opts: any) {}
  listBases(): Promise<any[]> { return Promise.resolve([]); }
  listTables(_baseId: string): Promise<any[]> { return Promise.resolve([]); }
  listRecords(_baseId: string, _tableId: string): Promise<any[]> { return Promise.resolve([]); }
};

export function createAirtableClient(_opts: any): AirtableClient {
  return new AirtableClient(_opts);
}
