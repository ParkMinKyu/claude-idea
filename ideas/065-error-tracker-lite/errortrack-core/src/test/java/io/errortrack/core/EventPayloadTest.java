package io.errortrack.core;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EventPayloadTest {

    @Test
    void jsonContainsCoreFields() {
        ErrorTrackConfig cfg = ErrorTrackConfig.builder()
                .apiKey("k")
                .release("1.2.3")
                .environment("staging")
                .build();
        RuntimeException error = new RuntimeException("boom");

        EventPayload payload = EventPayload.fromThrowable(error, cfg, Map.of("userId", "u-1"));
        String json = payload.toJson();

        assertThat(json).contains("\"exception_class\":\"java.lang.RuntimeException\"");
        assertThat(json).contains("\"message\":\"boom\"");
        assertThat(json).contains("\"fingerprint\":\"" + payload.fingerprint() + "\"");
        assertThat(json).contains("\"release\":\"1.2.3\"");
        assertThat(json).contains("\"environment\":\"staging\"");
        assertThat(json).contains("\"userId\":\"u-1\"");
    }

    @Test
    void jsonEscapesQuotesAndNewlines() {
        ErrorTrackConfig cfg = ErrorTrackConfig.builder().apiKey("k").build();
        RuntimeException error = new RuntimeException("line1\nline\"2\"");

        EventPayload payload = EventPayload.fromThrowable(error, cfg, Map.of());
        String json = payload.toJson();

        assertThat(json).contains("line1\\nline\\\"2\\\"");
    }

    @Test
    void nullReleaseIsRenderedAsJsonNull() {
        ErrorTrackConfig cfg = ErrorTrackConfig.builder().apiKey("k").build();
        EventPayload payload = EventPayload.fromThrowable(new RuntimeException("x"), cfg, Map.of());

        assertThat(payload.toJson()).contains("\"release\":null");
    }
}
