package io.errortrack.core;

import com.github.tomakehurst.wiremock.WireMockServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

class ErrorTrackClientTest {

    private WireMockServer server;

    @BeforeEach
    void start() {
        server = new WireMockServer(0);
        server.start();
        server.stubFor(post(urlEqualTo("/ingest")).willReturn(aResponse().withStatus(202)));
    }

    @AfterEach
    void stop() {
        server.stop();
    }

    @Test
    void capturedExceptionIsSentToEndpoint() throws InterruptedException {
        ErrorTrackConfig cfg = ErrorTrackConfig.builder()
                .apiKey("test-key")
                .endpoint("http://localhost:" + server.port() + "/ingest")
                .installShutdownHook(false)
                .timeout(Duration.ofSeconds(2))
                .build();
        ErrorTrackClient client = new ErrorTrackClient(cfg);
        try {
            client.capture(new RuntimeException("hello"), Map.of("traceId", "t-1"));

            long deadline = System.currentTimeMillis() + 3000;
            while (server.getAllServeEvents().isEmpty() && System.currentTimeMillis() < deadline) {
                Thread.sleep(50);
            }
            server.verify(postRequestedFor(urlEqualTo("/ingest"))
                    .withHeader("X-Api-Key", equalTo("test-key")));
        } finally {
            client.shutdown();
        }

        String body = server.getAllServeEvents().get(0).getRequest().getBodyAsString();
        assertThat(body).contains("\"message\":\"hello\"");
        assertThat(body).contains("\"traceId\":\"t-1\"");
    }
}
