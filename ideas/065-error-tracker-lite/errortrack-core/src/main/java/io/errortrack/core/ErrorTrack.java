package io.errortrack.core;

import java.util.Map;

public final class ErrorTrack {

    private static volatile ErrorTrackClient client;

    private ErrorTrack() {}

    public static void init(String apiKey) {
        init(ErrorTrackConfig.builder().apiKey(apiKey).build());
    }

    public static synchronized void init(ErrorTrackConfig config) {
        if (client != null) {
            return;
        }
        ErrorTrackClient created = new ErrorTrackClient(config);
        created.installGlobalHandlers();
        client = created;
    }

    public static void capture(Throwable error) {
        ErrorTrackClient c = client;
        if (c == null) {
            return;
        }
        c.capture(error, Map.of());
    }

    public static void capture(Throwable error, Map<String, String> context) {
        ErrorTrackClient c = client;
        if (c == null) {
            return;
        }
        c.capture(error, context);
    }

    public static boolean isInitialized() {
        return client != null;
    }

    static ErrorTrackClient client() {
        return client;
    }

    static synchronized void resetForTests() {
        if (client != null) {
            client.shutdown();
            client = null;
        }
    }
}
