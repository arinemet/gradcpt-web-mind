interface HeadphoneCheckResult {
  didPass: boolean;
}

interface HeadphoneCheckApi {
  runHeadphoneCheck(options: Record<string, unknown>): void;
}

interface JQueryDocument {
  ready(handler: () => void): void;
  on(
    eventName: "hcHeadphoneCheckEnd",
    handler: (event: Event, data: HeadphoneCheckResult) => void,
  ): void;
  off(
    eventName: "hcHeadphoneCheckEnd",
    handler: (event: Event, data: HeadphoneCheckResult) => void,
  ): void;
}

declare const HeadphoneCheck: HeadphoneCheckApi;
declare function $(target: Document): JQueryDocument;
