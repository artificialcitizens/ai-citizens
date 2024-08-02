import { XMLParser } from "fast-xml-parser";
const parser = new XMLParser();

/**
 * Parse XML from a string
 * @param xml - The XML string to parse
 * @returns The parsed XML as an object
 * @TODO - add dynamic type checking to the parser
 */
export const parseXml = (xml: string) => {
  const xmlDoc = parser.parse(`<root>${xml}</root>`);
  return xmlDoc.root || {};
};
