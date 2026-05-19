package io.errortrack.core;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;
import java.util.logging.Logger;

public final class ErrorTrackClient {

    private static final Logger LOG = Logger.getLogger(ErrorTrackClient.class.getName());

    private final ErrorTrackConfig config;
    private final HttpClient http;
    private final BlockingQueue<EventPayload> queue;
    private final Thread worker;
    private final AtomicBoolean running = new AtomicBoolean(true);

    public ErrorTrackClient(ErrorTrackConfig config) {
        this.config = config;
        this.http = HttpClient.newBuilder()
                .connectTimeout(config.timeout())
                .build();
        this.queue = new ArrayBlockingQueue<>(config.maxQueue());
        this.worker = new Thread(this::drainLoop, "errortrack-sender");
        this.worker.setDaemon(true);
        this.worker.start();
    }

    void installGlobalHandlers() {
        Thread.UncaughtExceptionHandler previous = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            try {
                capture(throwable, Map.of("thread", thread.getName()));
            } catch (Throwable suppress) {
                // never let the tracker break the JVM
            }
            if (previous != null) {
                previous.uncaughtException(thread, throwable);
            }
        });
        if (config.installShutdownHook()) {
            Runtime.getRuntime().addShutdownHook(new Thread(this::shutdown, "errortrack-shutdown"));
        }
    }

    public void capture(Throwable t, Map<String, String> context) {
        if (t == null || !running.get()) return;
        try {
            EventPayload payload = EventPayload.fromThrowable(t, config, context);
            if (!queue.offer(payload)) {
                LOG.log(Level.FINE, "errortrack queue full, dropping event");
            }
        } catch (Throwable suppress) {
            // never let the tracker break the caller
        }
    }

    public ErrorTrackConfig config() {
        return config;
    }

    public int queueSize() {
        return queue.size();
    }

    void shutdown() {
        if (!running.compareAndSet(true, false)) return;
        worker.interrupt();
        try {
            worker.join(TimeUnit.SECONDS.toMillis(2));
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    private void drainLoop() {
        while (running.get() || !queue.isEmpty()) {
            EventPayload payload;
            try {
                payload = queue.poll(500, TimeUnit.MILLISECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                continue;
            }
            if (payload == null) continue;
            sendOnce(payload);
        }
    }

    private void sendOnce(EventPayload payload) {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(config.endpoint())
                    .timeout(config.timeout())
                    .header("Content-Type", "application/json")
                    .header("X-Api-Key", config.apiKey())
                    .header("User-Agent", "errortrack-java/1.0")
                    .POST(HttpRequest.BodyPublishers.ofString(payload.toJson()))
                    .build();
            HttpResponse<Void> resp = http.send(req, HttpResponse.BodyHandlers.discarding());
            if (resp.statusCode() >= 500) {
                LOG.log(Level.FINE, "errortrack server returned {0}", resp.statusCode());
            }
        } catch (Throwable suppress) {
            LOG.log(Level.FINE, "errortrack send failed", suppress);
        }
    }
}
