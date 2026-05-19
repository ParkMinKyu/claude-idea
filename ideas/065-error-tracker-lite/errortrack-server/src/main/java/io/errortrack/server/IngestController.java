package io.errortrack.server;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/ingest")
public class IngestController {

    private final IssueStore store;

    public IngestController(IssueStore store) {
        this.store = store;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> ingest(
            @RequestHeader(value = "X-Api-Key", required = false) String apiKey,
            @RequestBody Map<String, Object> body) {
        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String eventId = store.record(apiKey, body);
        return ResponseEntity.accepted().body(Map.of("event_id", eventId));
    }
}
