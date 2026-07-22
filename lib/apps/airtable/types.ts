/**
 * @deprecated Stub for the deleted Airtable types.
 */
export interface AirtableBase {
  id: string;
  name: string;
}
export interface AirtableTable {
  id: string;
  name: string;
  fields: AirtableField[];
}
export interface AirtableField {
  id: string;
  name: string;
  type: string;
}
export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}
