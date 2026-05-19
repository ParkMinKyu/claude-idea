package io.errortrack.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BoomController {

    private static final Logger log = LoggerFactory.getLogger(BoomController.class);

    @GetMapping("/")
    public String index() {
        return "ErrorTrack demo. Try /boom /npe /log-error";
    }

    @GetMapping("/boom")
    public String boom() {
        throw new IllegalStateException("something exploded");
    }

    @GetMapping("/npe")
    public String npe() {
        String s = null;
        return s.toLowerCase();
    }

    @GetMapping("/log-error")
    public String logError() {
        MDC.put("userId", "demo-user-1");
        try {
            log.error("payment processing failed", new RuntimeException("declined"));
        } finally {
            MDC.remove("userId");
        }
        return "logged";
    }
}
