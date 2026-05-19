package io.errortrack.core;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public final class EventPayload {

    private final String eventId;
    private final Instant timestamp;
    private final String message;
    private final String exceptionClass;
    private final String stackTrace;
    private final String fingerprint;
    private final String release;
    private final String environment;
    private final String runtime;
    private final String hostname;
    private final Map<String, String> context;

    private EventPayload(Builder b) {
        this.eventId = b.eventId;
        this.timestamp = b.timestamp;
        this.message = b.message;
        this.exceptionClass = b.exceptionClass;
        this.stackTrace = b.stackTrace;
        this.fingerprint = b.fingerprint;
        this.release = b.release;
        this.environment = b.environment;
        this.runtime = b.runtime;
        this.hostname = b.hostname;
        this.context = b.context;
    }

    public static EventPayload fromThrowable(Throwable t, ErrorTrackConfig cfg, Map<String, String> context) {
        Builder b = new Builder();
        b.eventId = UUID.randomUUID().toString();
        b.timestamp = Instant.now();
        b.message = t.getMessage();
        b.exceptionClass = t.getClass().getName();
        b.stackTrace = stackTraceToString(t);
        b.fingerprint = Fingerprint.of(t);
        b.release = cfg.release();
        b.environment = cfg.environment();
        b.runtime = "java " + System.getProperty("java.version");
        b.hostname = hostname();
        b.context = context != null ? context : Map.of();
        return new EventPayload(b);
    }

    public String toJson() {
        StringBuilder sb = new StringBuilder(512);
        sb.append('{');
        appendString(sb, "event_id", eventId).append(',');
        appendString(sb, "timestamp", timestamp.toString()).append(',');
        appendString(sb, "message", nullToEmpty(message)).append(',');
        appendString(sb, "exception_class", exceptionClass).append(',');
        appendString(sb, "stack_trace", stackTrace).append(',');
        appendString(sb, "fingerprint", fingerprint).append(',');
        appendStringOrNull(sb, "release", release).append(',');
        appendString(sb, "environment", environment).append(',');
        appendString(sb, "runtime", runtime).append(',');
        appendString(sb, "hostname", hostname).append(',');
        sb.append("\"context\":");
        appendMap(sb, context);
        sb.append('}');
        return sb.toString();
    }

    public String eventId() { return eventId; }
    public String fingerprint() { return fingerprint; }
    public String exceptionClass() { return exceptionClass; }
    public String message() { return message; }

    private static String stackTraceToString(Throwable t) {
        StringWriter sw = new StringWriter();
        t.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }

    private static String hostname() {
        String h = System.getenv("HOSTNAME");
        if (h != null && !h.isEmpty()) return h;
        try {
            return java.net.InetAddress.getLocalHost().getHostName();
        } catch (Exception ignored) {
            return "unknown";
        }
    }

    private static StringBuilder appendString(StringBuilder sb, String key, String value) {
        sb.append('"').append(key).append("\":\"").append(escape(value)).append('"');
        return sb;
    }

    private static StringBuilder appendStringOrNull(StringBuilder sb, String key, String value) {
        if (value == null) {
            sb.append('"').append(key).append("\":null");
        } else {
            appendString(sb, key, value);
        }
        return sb;
    }

    private static void appendMap(StringBuilder sb, Map<String, String> map) {
        sb.append('{');
        boolean first = true;
        for (Map.Entry<String, String> e : map.entrySet()) {
            if (!first) sb.append(',');
            first = false;
            sb.append('"').append(escape(e.getKey())).append("\":\"")
              .append(escape(nullToEmpty(e.getValue()))).append('"');
        }
        sb.append('}');
    }

    private static String escape(String s) {
        if (s == null) return "";
        StringBuilder out = new StringBuilder(s.length() + 16);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': out.append("\\\""); break;
                case '\\': out.append("\\\\"); break;
                case '\b': out.append("\\b"); break;
                case '\f': out.append("\\f"); break;
                case '\n': out.append("\\n"); break;
                case '\r': out.append("\\r"); break;
                case '\t': out.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
            }
        }
        return out.toString();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private static final class Builder {
        String eventId;
        Instant timestamp;
        String message;
        String exceptionClass;
        String stackTrace;
        String fingerprint;
        String release;
        String environment;
        String runtime;
        String hostname;
        Map<String, String> context = new LinkedHashMap<>();
    }
}
