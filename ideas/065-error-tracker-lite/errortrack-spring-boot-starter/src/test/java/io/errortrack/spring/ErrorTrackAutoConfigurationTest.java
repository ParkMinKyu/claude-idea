package io.errortrack.spring;

import io.errortrack.core.ErrorTrack;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class ErrorTrackAutoConfigurationTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(ErrorTrackAutoConfiguration.class));

    @AfterEach
    void tearDown() {
        ErrorTrack.resetForTests();
    }

    @Test
    void autoConfigDisabledWithoutApiKey() {
        runner.run(ctx -> {
            assertThat(ctx).doesNotHaveBean(ErrorTrackProperties.class);
            assertThat(ErrorTrack.isInitialized()).isFalse();
        });
    }

    @Test
    void autoConfigInitializesWhenApiKeyPresent() {
        runner.withPropertyValues(
                        "errortrack.api-key=test-key",
                        "errortrack.endpoint=http://localhost:9/ingest",
                        "errortrack.environment=test")
                .run(ctx -> {
                    assertThat(ctx).hasSingleBean(ErrorTrackProperties.class);
                    ErrorTrackProperties p = ctx.getBean(ErrorTrackProperties.class);
                    assertThat(p.getApiKey()).isEqualTo("test-key");
                    assertThat(p.getEnvironment()).isEqualTo("test");
                    assertThat(ErrorTrack.isInitialized()).isTrue();
                });
    }
}
