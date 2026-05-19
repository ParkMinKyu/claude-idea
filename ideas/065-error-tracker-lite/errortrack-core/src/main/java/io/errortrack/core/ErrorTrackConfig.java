package io.errortrack.core;

import java.net.URI;
import java.time.Duration;
import java.util.Objects;

public final class ErrorTrackConfig {

    private final String apiKey;
    private final URI endpoint;
    private final String release;
    private final String environment;
    private final Duration timeout;
    private final int maxQueue;
    private final boolean installShutdownHook;

    private ErrorTrackConfig(Builder b) {
        this.apiKey = Objects.requireNonNull(b.apiKey, "apiKey");
        this.endpoint = b.endpoint;
        this.release = b.release;
        this.environment = b.environment;
        this.timeout = b.timeout;
        this.maxQueue = b.maxQueue;
        this.installShutdownHook = b.installShutdownHook;
    }

    public String apiKey() { return apiKey; }
    public URI endpoint() { return endpoint; }
    public String release() { return release; }
    public String environment() { return environment; }
    public Duration timeout() { return timeout; }
    public int maxQueue() { return maxQueue; }
    public boolean installShutdownHook() { return installShutdownHook; }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private String apiKey;
        private URI endpoint = URI.create("https://api.errortrack.io/ingest");
        private String release;
        private String environment = "production";
        private Duration timeout = Duration.ofSeconds(5);
        private int maxQueue = 1000;
        private boolean installShutdownHook = true;

        public Builder apiKey(String v) { this.apiKey = v; return this; }
        public Builder endpoint(URI v) { this.endpoint = v; return this; }
        public Builder endpoint(String v) { this.endpoint = URI.create(v); return this; }
        public Builder release(String v) { this.release = v; return this; }
        public Builder environment(String v) { this.environment = v; return this; }
        public Builder timeout(Duration v) { this.timeout = v; return this; }
        public Builder maxQueue(int v) { this.maxQueue = v; return this; }
        public Builder installShutdownHook(boolean v) { this.installShutdownHook = v; return this; }

        public ErrorTrackConfig build() {
            return new ErrorTrackConfig(this);
        }
    }
}
