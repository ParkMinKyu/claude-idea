package io.errortrack.spring;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import io.errortrack.core.ErrorTrack;
import io.errortrack.core.ErrorTrackConfig;
import io.errortrack.logback.ErrorTrackAppender;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@AutoConfiguration
@ConditionalOnProperty(prefix = "errortrack", name = "api-key")
@EnableConfigurationProperties(ErrorTrackProperties.class)
public class ErrorTrackAutoConfiguration {

    private final ErrorTrackProperties props;

    public ErrorTrackAutoConfiguration(ErrorTrackProperties props) {
        this.props = props;
    }

    @PostConstruct
    void start() {
        ErrorTrack.init(ErrorTrackConfig.builder()
                .apiKey(props.getApiKey())
                .endpoint(props.getEndpoint())
                .release(props.getRelease())
                .environment(props.getEnvironment())
                .build());
        if (props.isLogback()) {
            attachLogbackAppender();
        }
    }

    private void attachLogbackAppender() {
        LoggerContext ctx = (LoggerContext) LoggerFactory.getILoggerFactory();
        Logger root = ctx.getLogger(Logger.ROOT_LOGGER_NAME);
        if (root.getAppender("errortrack") != null) return;
        ErrorTrackAppender appender = new ErrorTrackAppender();
        appender.setName("errortrack");
        appender.setContext(ctx);
        appender.start();
        root.addAppender(appender);
    }

    @Configuration
    @ConditionalOnWebApplication
    @ConditionalOnClass(name = "org.springframework.web.bind.annotation.ControllerAdvice")
    static class WebConfiguration {

        @Bean
        @ConditionalOnProperty(prefix = "errortrack", name = "web", havingValue = "true", matchIfMissing = true)
        public ErrorTrackExceptionResolver errorTrackExceptionResolver() {
            return new ErrorTrackExceptionResolver();
        }
    }
}
