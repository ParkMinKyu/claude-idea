package io.errortrack.server;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * In-memory issue store for the MVP.
 *
 * Each unique fingerprint becomes an Issue; each ingested payload is appended
 * as an Event under that issue. Production would replace this with Postgres,
 * but the interface is small enough to swap behind a JpaIssueStore later.
 */
@Component
public class IssueStore {

    private final ConcurrentMap<String, Issue> issues = new ConcurrentHashMap<>();

    public String record(String apiKey, Map<String, Object> payload) {
        String fingerprint = stringOr(payload.get("fingerprint"), "unknown");
        String eventId = stringOr(payload.get("event_id"), UUID.randomUUID().toString());
        Instant now = Instant.now();

        Issue issue = issues.computeIfAbsent(fingerprint, fp -> new Issue(
                fp,
                stringOr(payload.get("exception_class"), "Unknown"),
                stringOr(payload.get("message"), ""),
                now));
        issue.append(new Event(
                eventId,
                now,
                stringOr(payload.get("message"), ""),
                stringOr(payload.get("stack_trace"), ""),
                stringOr(payload.get("environment"), ""),
                stringOr(payload.get("release"), ""),
                stringOr(payload.get("hostname"), ""),
                asMap(payload.get("context"))));
        return eventId;
    }

    public List<Issue> list() {
        List<Issue> all = new ArrayList<>(issues.values());
        all.sort(Comparator.comparing(Issue::lastSeen).reversed());
        return all;
    }

    public Issue find(String fingerprint) {
        return issues.get(fingerprint);
    }

    public int totalIssues() {
        return issues.size();
    }

    public long totalEvents() {
        return issues.values().stream().mapToLong(Issue::eventCount).sum();
    }

    void clear() {
        issues.clear();
    }

    private static String stringOr(Object value, String fallback) {
        return value == null ? fallback : value.toString();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, String> asMap(Object value) {
        if (value instanceof Map<?, ?> m) {
            Map<String, String> out = new java.util.LinkedHashMap<>();
            m.forEach((k, v) -> out.put(String.valueOf(k), v == null ? "" : v.toString()));
            return out;
        }
        return Map.of();
    }

    public static final class Issue {
        private final String fingerprint;
        private final String exceptionClass;
        private final String message;
        private final Instant firstSeen;
        private volatile Instant lastSeen;
        private final List<Event> events = java.util.Collections.synchronizedList(new ArrayList<>());

        Issue(String fingerprint, String exceptionClass, String message, Instant firstSeen) {
            this.fingerprint = fingerprint;
            this.exceptionClass = exceptionClass;
            this.message = message;
            this.firstSeen = firstSeen;
            this.lastSeen = firstSeen;
        }

        void append(Event event) {
            events.add(event);
            this.lastSeen = event.timestamp();
        }

        public String fingerprint() { return fingerprint; }
        public String exceptionClass() { return exceptionClass; }
        public String message() { return message; }
        public Instant firstSeen() { return firstSeen; }
        public Instant lastSeen() { return lastSeen; }
        public long eventCount() { return events.size(); }
        public Collection<Event> events() { return List.copyOf(events); }
    }

    public record Event(
            String eventId,
            Instant timestamp,
            String message,
            String stackTrace,
            String environment,
            String release,
            String hostname,
            Map<String, String> context) {}
}
