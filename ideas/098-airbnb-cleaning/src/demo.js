import { parseICal } from "./ical.js";
import { syncProperty, assignCleaner, buildSmsPayload, recordResponse, completeJob } from "./dispatch.js";

const ical = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:res-001@airbnb.com
DTSTART:20260601T140000Z
DTEND:20260603T110000Z
SUMMARY:Reserved
END:VEVENT
BEGIN:VEVENT
UID:res-002@airbnb.com
DTSTART:20260603T140000Z
DTEND:20260605T110000Z
SUMMARY:Reserved
END:VEVENT
END:VCALENDAR`;

const { newJobs } = syncProperty({ icalText: ical, propertyId: "P1", existingJobs: [], parser: parseICal });
console.log("jobs:", newJobs);

const cleaners = [
  { id: "C1", phone: "+821012345678", priority: 10, rating: 4.8, active: true, servicesProperty: () => true },
  { id: "C2", phone: "+821087654321", priority: 5, rating: 4.9, active: true, servicesProperty: () => true },
];

const dispatched = assignCleaner(newJobs[0], cleaners);
console.log("dispatched:", dispatched);
console.log("sms:", buildSmsPayload(dispatched, cleaners.find((c) => c.id === dispatched.assignedCleanerId), "Seoul Loft"));

const accepted = recordResponse(dispatched, "accept");
const done = completeJob(accepted, { photoUrls: ["https://r2.example.com/p1.jpg"] });
console.log("done:", done);
