package io.errortrack.logback;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import io.errortrack.core.ErrorTrack;
import io.errortrack.core.ErrorTrackConfig;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import com.github.tomakehurst.wiremock.WireMockServer;

import java.time.Duration;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

class ErrorTrackAppenderTest {

    private WireMockServer server;

    @BeforeEach
    void setUp() {
        server = new WireMockServer(0);
        server.start();
        server.stubFor(post(urlEqualTo("/ingest")).willReturn(aResponse().withStatus(202)));
        ErrorTrack.init(ErrorTrackConfig.builder()
                .apiKey("k")
                .endpoint("http://localhost:" + server.port() + "/ingest")
                .installShutdownHook(false)
                .timeout(Duration.ofSeconds(2))
                .build());
    }

    @AfterEach
    void tearDown() {
        ErrorTrack.resetForTests();
        server.stop();
        MDC.clear();
    }

    @Test
    void errorLogWithThrowableIsForwardedWithMdc() throws InterruptedException {
        LoggerContext ctx = (LoggerContext) org.slf4j.LoggerFactory.getILoggerFactory();
        Logger root = ctx.getLogger(Logger.ROOT_LOGGER_NAME);
        ErrorTrackAppender appender = new ErrorTrackAppender();
        appender.setContext(ctx);
        appender.start();
        root.addAppender(appender);
        root.setLevel(Level.INFO);

        MDC.put("userId", "u-7");
        try {
            org.slf4j.LoggerFactory.getLogger("test").error("boom", new IllegalStateException("oops"));
        } finally {
            MDC.remove("userId");
        }

        long deadline = System.currentTimeMillis() + 3000;
        while (server.getAllServeEvents().isEmpty() && System.currentTimeMillis() < deadline) {
            Thread.sleep(50);
        }
        assertThat(server.getAllServeEvents()).hasSize(1);
        String body = server.getAllServeEvents().get(0).getRequest().getBodyAsString();
        assertThat(body).contains("\"exception_class\":\"java.lang.IllegalStateException\"");
        assertThat(body).contains("\"userId\":\"u-7\"");
    }
}
