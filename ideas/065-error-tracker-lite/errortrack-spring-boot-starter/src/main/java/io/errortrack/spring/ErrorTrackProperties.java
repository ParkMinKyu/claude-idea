package io.errortrack.spring;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "errortrack")
public class ErrorTrackProperties {

    /** API key issued by the ErrorTrack dashboard. Required to activate the SDK. */
    private String apiKey;

    /** Collector endpoint. Defaults to cloud; override for self-hosted. */
    private String endpoint = "https://api.errortrack.io/ingest";

    /** Release identifier, e.g. git SHA or semver. */
    private String release;

    /** Environment name, e.g. production, staging. */
    private String environment = "production";

    /** Whether to attach the Logback appender automatically. */
    private boolean logback = true;

    /** Whether to register the Spring MVC exception handler. */
    private boolean web = true;

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getRelease() { return release; }
    public void setRelease(String release) { this.release = release; }

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }

    public boolean isLogback() { return logback; }
    public void setLogback(boolean logback) { this.logback = logback; }

    public boolean isWeb() { return web; }
    public void setWeb(boolean web) { this.web = web; }
}
