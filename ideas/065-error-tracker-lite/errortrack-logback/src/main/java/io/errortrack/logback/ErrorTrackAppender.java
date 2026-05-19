package io.errortrack.logback;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.classic.spi.StackTraceElementProxy;
import ch.qos.logback.classic.spi.ThrowableProxy;
import ch.qos.logback.core.AppenderBase;
import io.errortrack.core.ErrorTrack;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Logback appender that forwards ERROR-level events (with a Throwable) to ErrorTrack.
 * Registered automatically by the Spring Boot starter; can also be added to logback.xml
 * for non-Spring apps.
 */
public class ErrorTrackAppender extends AppenderBase<ILoggingEvent> {

    private Level threshold = Level.ERROR;

    public void setThreshold(String level) {
        this.threshold = Level.toLevel(level, Level.ERROR);
    }

    @Override
    protected void append(ILoggingEvent event) {
        if (!ErrorTrack.isInitialized()) return;
        if (!event.getLevel().isGreaterOrEqual(threshold)) return;

        IThrowableProxy proxy = event.getThrowableProxy();
        Throwable throwable = unwrap(proxy);
        Map<String, String> context = buildContext(event);

        if (throwable != null) {
            ErrorTrack.capture(throwable, context);
        } else if (threshold == Level.ERROR && event.getLevel() == Level.ERROR) {
            ErrorTrack.capture(new LoggedMessage(event.getFormattedMessage()), context);
        }
    }

    private Map<String, String> buildContext(ILoggingEvent event) {
        Map<String, String> context = new LinkedHashMap<>();
        context.put("logger", event.getLoggerName());
        context.put("thread", event.getThreadName());
        Map<String, String> mdc = event.getMDCPropertyMap();
        if (mdc != null) {
            context.putAll(mdc);
        }
        return context;
    }

    private static Throwable unwrap(IThrowableProxy proxy) {
        if (proxy instanceof ThrowableProxy tp) {
            return tp.getThrowable();
        }
        if (proxy == null) return null;
        return new ReconstructedThrowable(proxy);
    }

    static final class LoggedMessage extends RuntimeException {
        LoggedMessage(String message) {
            super(message);
        }
    }

    static final class ReconstructedThrowable extends RuntimeException {
        ReconstructedThrowable(IThrowableProxy proxy) {
            super(proxy.getClassName() + ": " + proxy.getMessage());
            StackTraceElementProxy[] frames = proxy.getStackTraceElementProxyArray();
            StackTraceElement[] trace = new StackTraceElement[frames.length];
            for (int i = 0; i < frames.length; i++) {
                trace[i] = frames[i].getStackTraceElement();
            }
            setStackTrace(trace);
        }
    }
}
